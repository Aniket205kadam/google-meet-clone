package dev.aniketkadam.server.messages;

import dev.aniketkadam.server.call.Call;
import dev.aniketkadam.server.call.CallRepository;
import dev.aniketkadam.server.call.CallResponse;
import dev.aniketkadam.server.call.CallStatus;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.message.*;
import dev.aniketkadam.server.user.User;
import dev.aniketkadam.server.user.UserResponse;
import dev.aniketkadam.server.webrtc.CallMode;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Message Service Tests")
class MessageServiceTest {

    @Mock
    private CallRepository callRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private MessageMapper messageMapper;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private MessageService messageService;

    private User testUser;
    private Authentication testAuthentication;
    private Call testCall;
    private Message testSavedMessage;
    private MessageResponse testMessageResponse;

    @BeforeEach
    void setup() {
        MessageServiceTest.this.testUser = User.builder()
                .id("user-123")
                .email("user@test.com")
                .build();
        MessageServiceTest.this.testAuthentication = new UsernamePasswordAuthenticationToken(
                testUser,
                null,
                Collections.emptyList()
        );
        User testReceiver = User.builder()
                .id("user-1234")
                .email("receiver@test.com")
                .build();
        this.testCall = Call.builder()
                .id("call-123")
                .caller(testUser)
                .receiver(testReceiver)
                .status(CallStatus.ACCEPTED)
                .mode(CallMode.VIDEO)
                .messages(Collections.emptyList())
                .startedAt(LocalDateTime.of(2024, 1, 1, 10, 0))
                .endedAt(LocalDateTime.of(2024, 1, 1, 11, 0))
                .build();
        this.testSavedMessage = Message.builder()
                .content("Unit testing message")
                .call(testCall)
                .sender(testUser)
                .receiver(testReceiver)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();
        this.testMessageResponse = MessageResponse.builder()
                .content("Unit testing message")
                .call(CallResponse.builder().id(testCall.getId()).build())
                .sender(UserResponse.builder().id(testUser.getId()).build())
                .receiver(UserResponse.builder().id(testReceiver.getId()).build())
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();
    }

    @Nested
    @DisplayName("Send Message Tests")
    class SendMessageTests {

        @Test
        @DisplayName("Should message send successfully to receiver")
        void shouldSendMessageSuccessfully() throws OperationNotPermittedException {
            String callId = "call-123";
            String content = "Unit testing message";

            when(callRepository.findById(callId))
                    .thenReturn(Optional.of(testCall));
            when(messageRepository.save(any(Message.class)))
                    .thenReturn(testSavedMessage);
            when(messageMapper.toMessageResponse(testSavedMessage))
                    .thenReturn(testMessageResponse);

            MessageResponse result = messageService.sendMessage(
                    callId,
                    content,
                    testAuthentication
            );

            assertNotNull(result);
            assertEquals(content, result.getContent());

            verify(messageRepository).save(argThat(msg ->
                    msg.getSender().equals(testUser) &&
                    msg.getReceiver().equals(testCall.getReceiver()) &&
                    msg.getContent().equals(content)
            ));
            verify(messagingTemplate).convertAndSend(
                    eq("/topic/call/" + callId + "/messages/user/" + testCall.getReceiver().getEmail()),
                    eq(result)
            );
            verify(callRepository, times(1))
                    .findById(any(String.class));
            verify(messageRepository, times(1))
                    .save(any(Message.class));
            verify(messageMapper, times(1))
                    .toMessageResponse(any(Message.class));
        }

        @Test
        @DisplayName("Should throw exception when call not found")
        void shouldThrowException_whenCallNotFound() {
            String callId = "call-123";
            String content = "Unit testing message";

            when(callRepository.findById(callId))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> messageService.sendMessage(callId, content, testAuthentication)
            );

            assertNotNull(exception);
            assertEquals("Call is not found with ID: " + callId, exception.getMessage());
            verifyNoInteractions(messageRepository, messageMapper, messagingTemplate);
        }

        @Test
        @DisplayName("Should throw exception when user is not participant")
        void shouldThrowException_whenUserIsNotParticipant() {
            User outsider = User.builder()
                    .id("outside-123")
                    .email("outside@test.com")
                    .build();
            Authentication outsiderAuthObj = new UsernamePasswordAuthenticationToken(
                    outsider,
                    null,
                    List.of()
            );
            when(callRepository.findById("call-123"))
                    .thenReturn(Optional.of(testCall));

            OperationNotPermittedException exception = assertThrows(
                    OperationNotPermittedException.class,
                    () -> messageService.sendMessage("call-123", "Unit testing content", outsiderAuthObj)
            );

            assertNotNull(exception);
            assertEquals("Only caller and receiver can send messages.", exception.getMessage());
            verifyNoInteractions(messageRepository, messageMapper, messagingTemplate);
        }

        @Test
        @DisplayName("Should throw exception when call is not accepted")
        void shouldThrowException_whenCallIsNotAccepted() {
            testCall.setStatus(CallStatus.REJECTED);

            when(callRepository.findById("call-123"))
                    .thenReturn(Optional.of(testCall));

            OperationNotPermittedException exception = assertThrows(
                    OperationNotPermittedException.class,
                    () -> messageService.sendMessage(
                            "call-123",
                            "Unit testing content",
                            testAuthentication
                    )
            );

            assertNotNull(exception);
            assertEquals("Call is ended or not accepted yet.", exception.getMessage());
            verifyNoInteractions(messageRepository, messageMapper, messagingTemplate);
        }
    }

    @Nested
    @DisplayName("Get Messages By Call Id Tests")
    class GetMessagesByCallIdTests {

        @Test
        @DisplayName("Should get messages by call-id successfully")
        void shouldGetMessagesByCallIdSuccessfully() throws OperationNotPermittedException {
            String callId = "call-123";
            Message message1 = Message.builder()
                    .id("msg-123")
                    .content("msg-1")
                    .build();
            Message message2 = Message.builder()
                    .id("msg-1234")
                    .content("msg-2")
                    .build();

            testCall.setMessages(List.of(
                    message1,
                    message2
            ));

            when(MessageServiceTest.this.callRepository.findById(callId))
                    .thenReturn(Optional.of(testCall));
            when(MessageServiceTest.this.messageMapper.toMessageResponse(message1))
                    .thenReturn(MessageResponse.builder()
                            .id(message1.getId())
                            .content(message1.getContent())
                            .build()
                    );
            when(MessageServiceTest.this.messageMapper.toMessageResponse(message2))
                    .thenReturn(MessageResponse.builder()
                            .id(message2.getId())
                            .content(message2.getContent())
                            .build()
                    );

            List<MessageResponse> messageResponses = messageService.getMessagesByCallId(callId, testAuthentication);

            assertNotNull(messageResponses);
            assertEquals(testCall.getMessages().size(), messageResponses.size());

            verify(callRepository, times(1))
                    .findById(any(String.class));
            verify(messageMapper, times(testCall.getMessages().size()))
                    .toMessageResponse(any(Message.class));
        }

        @Test
        @DisplayName("Should throw exception successfully when call is not found by Id")
        void shouldThrowException_whenCallIsNotFoundById() {
            String callId = "call-123";

            when(callRepository.findById(callId))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> messageService.getMessagesByCallId(callId, testAuthentication)
            );


            assertNotNull(exception);
            assertEquals("Call is not found with Id: " + callId, exception.getMessage());

            verifyNoInteractions(messageMapper);
        }

        @Test
        @DisplayName("Should throw exception successfully when user is not participant")
        void shouldThrowException_whenUserIsNotParticipant() {
            String callId = "call-123";

            User outsider = User.builder()
                    .id("outsider-123")
                    .email("outsider@test.com")
                    .build();

            when(MessageServiceTest.this.callRepository.findById(callId))
                    .thenReturn(Optional.of(testCall));

            OperationNotPermittedException exception = assertThrows(
                    OperationNotPermittedException.class,
                    () -> messageService.getMessagesByCallId(callId, new UsernamePasswordAuthenticationToken(outsider, null, Collections.emptyList()))
            );

            assertNotNull(exception);
            assertEquals("Only caller and receiver can read messages.", exception.getMessage());
            verifyNoInteractions(messageMapper);
        }

    }

}

