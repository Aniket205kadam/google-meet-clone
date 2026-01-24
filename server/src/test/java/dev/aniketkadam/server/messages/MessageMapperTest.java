package dev.aniketkadam.server.messages;

import dev.aniketkadam.server.call.Call;
import dev.aniketkadam.server.call.CallMapper;
import dev.aniketkadam.server.call.CallResponse;
import dev.aniketkadam.server.message.Message;
import dev.aniketkadam.server.message.MessageMapper;
import dev.aniketkadam.server.message.MessageResponse;
import dev.aniketkadam.server.user.User;
import dev.aniketkadam.server.user.UserMapper;
import dev.aniketkadam.server.user.UserResponse;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Message Mapper Tests")
@ActiveProfiles("test")
public class MessageMapperTest {

    @Mock
    private UserMapper userMapper;
    @Mock
    private CallMapper callMapper;

    @InjectMocks
    private MessageMapper messageMapper;

    private Message testMessage;

    @BeforeEach
    void setup() {
        this.testMessage = Message.builder()
                .id("message-123")
                .content("Unit testing message")
                .sender(
                        User.builder()
                            .id("user-1")
                            .email("user1@test.com")
                            .build()
                )
                .receiver(
                        User.builder()
                            .id("user-2")
                            .email("user2@test.com")
                            .build()
                )
                .call(
                        Call.builder()
                                .id("call-123")
                                .build()
                )
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();
    }

    @Nested
    @DisplayName("To Message Response Tests")
    class ToMessageResponseTests {

        @Test
        @DisplayName("Should Map object from Message to MessageResponse successfully")
        void shouldMapObj() {
            when(userMapper.toUserResponse(testMessage.getSender()))
                    .thenReturn(UserResponse.builder()
                            .id(testMessage.getSender().getId())
                            .email(testMessage.getSender().getEmail())
                            .build()
                    );
            when(userMapper.toUserResponse(testMessage.getReceiver()))
                    .thenReturn(UserResponse.builder()
                            .id(testMessage.getReceiver().getId())
                            .email(testMessage.getReceiver().getEmail())
                            .build()
                    );
            when(callMapper.toCallResponse(testMessage.getCall()))
                    .thenReturn(CallResponse.builder()
                            .id(testMessage.getCall().getId())
                            .build()
                    );

            MessageResponse messageResponse = messageMapper.toMessageResponse(testMessage);

            assertNotNull(messageResponse);
            assertEquals(messageResponse.getId(), testMessage.getId());
            assertEquals(messageResponse.getSender().getEmail(), testMessage.getSender().getEmail());
            assertEquals(messageResponse.getReceiver().getEmail(), testMessage.getReceiver().getEmail());
            assertEquals(messageResponse.getCall().getId(), testMessage.getCall().getId());

            verify(userMapper, times(2)).toUserResponse(any(User.class));
            verify(callMapper, times(1)).toCallResponse(any(Call.class));

        }
    }
}
