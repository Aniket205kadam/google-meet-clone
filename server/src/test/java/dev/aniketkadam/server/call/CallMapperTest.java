package dev.aniketkadam.server.call;

import dev.aniketkadam.server.user.User;
import dev.aniketkadam.server.user.UserMapper;
import dev.aniketkadam.server.user.UserResponse;
import dev.aniketkadam.server.webrtc.CallMode;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Call Mapper Tests")
public class CallMapperTest {

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private CallMapper callMapper;

    private Call testCall;
    private User testCaller;
    private User testReceiver;
    private UserResponse testCallerResponse;
    private UserResponse testReceiverResponse;

    @BeforeEach
    void setup() {
        CallMapperTest.this.testCaller = User.builder()
                .id("user-123")
                .email("caller@test.com")
                .build();
        CallMapperTest.this.testReceiver = User.builder()
                .id("user-1234")
                .email("receiver@test.com")
                .build();
        CallMapperTest.this.testCallerResponse = UserResponse.builder()
                .id(testCaller.getId())
                .email(testCaller.getEmail())
                .build();
        CallMapperTest.this.testReceiverResponse = UserResponse.builder()
                .id(testReceiver.getId())
                .email(testReceiver.getEmail())
                .build();
        CallMapperTest.this.testCall = Call.builder()
                .id("call-123")
                .caller(testCaller)
                .receiver(testReceiver)
                .status(CallStatus.ACCEPTED)
                .mode(CallMode.VIDEO)
                .messages(Collections.emptyList())
                .startedAt(LocalDateTime.now().minusMinutes(20))
                .endedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("To Call Response Test")
    class ToCallResponse {

        @Test
        @DisplayName("Should convert Call to CallResponse object successfully")
        void ShouldMapObjectSuccessfully() {
            when(CallMapperTest.this.userMapper.toUserResponse(testCaller))
                    .thenReturn(testCallerResponse);
            when(CallMapperTest.this.userMapper.toUserResponse(testReceiver))
                    .thenReturn(testReceiverResponse);

            final CallResponse response = callMapper.toCallResponse(testCall);

            assertNotNull(response);
            assertEquals(response.getId(), testCall.getId());
            assertEquals(response.getMode(), testCall.getMode());
            assertEquals(response.getStatus(), testCall.getStatus());
            assertEquals(response.getStartedAt(), testCall.getStartedAt());
            assertEquals(response.getEndedAt(), testCall.getEndedAt());
            assertEquals(testCaller.getEmail(), response.getCaller().getEmail());
            assertEquals(testReceiver.getEmail(), response.getReceiver().getEmail());

            verify(CallMapperTest.this.userMapper, times(2))
                    .toUserResponse(any(User.class));
        }

    }
}
