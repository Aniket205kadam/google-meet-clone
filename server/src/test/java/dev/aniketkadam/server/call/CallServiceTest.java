package dev.aniketkadam.server.call;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.pagination.PageResponse;
import dev.aniketkadam.server.user.User;
import dev.aniketkadam.server.user.UserResponse;
import dev.aniketkadam.server.webrtc.CallMode;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CallService Unit Tests")
@ActiveProfiles("test")
class CallServiceTest {


    @Mock
    private CallRepository callRepository;
    @Mock
    private CallMapper callMapper;

    @InjectMocks
    private CallService callService;

    private User testUser;
    private Authentication testAuthentication;
    private Call testCall;
    private CallResponse testCallResponse;

    @BeforeEach
    void setUp() {
        this.testUser = User.builder()
                .id("user-123")
                .email("user@test.com")
                .build();
        this.testAuthentication = new UsernamePasswordAuthenticationToken(
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
        this.testCallResponse = CallResponse.builder()
                .id("call-123")
                .callerId(testUser.getId())
                .caller(UserResponse.builder().id(testUser.getId()).build())
                .receiverId(testReceiver.getId())
                .receiver(UserResponse.builder().id(testReceiver.getId()).build())
                .status(CallStatus.ACCEPTED)
                .mode(CallMode.VIDEO)
                .startedAt(LocalDateTime.of(2024, 1, 1, 10, 0))
                .endedAt(LocalDateTime.of(2024, 1, 1, 11, 0))
                .build();
    }

    @Nested
    @DisplayName("Get Call By Id Tests")
    class GetCallByIdTests {

        @Test
        @DisplayName("Should fetch call successfully when valid user and Id exists")
        void shouldGetCallByIdSuccessfully() throws OperationNotPermittedException {
            final String callId = "call-123";

            when(CallServiceTest.this.callRepository.findById(callId))
                    .thenReturn(Optional.of(testCall));
            when(CallServiceTest.this.callMapper.toCallResponse(any(Call.class)))
                    .thenReturn(testCallResponse);

            final CallResponse result = CallServiceTest.this.callService.getCallById(callId, testAuthentication);

            assertNotNull(result);
            assertEquals(callId, result.getId());
            assertTrue(
                    testUser.getId().equals(result.getCallerId()) || testUser.getId().equals(result.getReceiverId()),
                    "User should be either caller or receiver"
            );
            verify(callRepository, times(1)).findById(callId);
            verify(callMapper, times(1)).toCallResponse(any(Call.class));

        }

        @Test
        @DisplayName("Should throw error when call id is not exist")
        void shouldThrowException_whenCallDoesNotExist() {
            final String callId = "call-123";

            when(CallServiceTest.this.callRepository.findById(callId))
                    .thenReturn(Optional.empty());

            final EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> callService.getCallById(callId, testAuthentication)
            );
            assertNotNull(exception);
            assertEquals("Call is not found with Id: " + callId, exception.getMessage());
            verifyNoInteractions(callMapper);
        }

        @Test
        @DisplayName("Should throw error when user is not participant on call")
        void shouldThrowException_whenUserIsNotParticipant() {
            final String callId = "call-123";
            testCall.setCaller(User.builder().id("user-12345").email("user1@test.com").build());

            when(CallServiceTest.this.callRepository.findById(callId))
                    .thenReturn(Optional.of(testCall));

            final OperationNotPermittedException exception = assertThrows(
                    OperationNotPermittedException.class,
                    () -> callService.getCallById(callId, testAuthentication)
            );

            assertNotNull(exception);
            assertEquals("Only call participant can get details of the call.", exception.getMessage());
            verifyNoInteractions(callMapper);
        }
    }

    @Nested
    @DisplayName("Get All Call History Tests")
    class GetAllCallHistoryTest {


        @Test
        @DisplayName("Should return pagination call history for authentication user")
        void shouldReturnCallHistorySuccessfully() {
            int page = 0;
            int size = 2;

            Pageable pageable = PageRequest.of(page, size, Sort.by("startedAt").descending());

            Page<Call> callPage = new PageImpl<>(
                    List.of(testCall),
                    pageable,
                    1
            );

            when(callRepository.findUserAllCalls(pageable, testUser.getId()))
                    .thenReturn(callPage);
            when(callMapper.toCallResponse(testCall))
                    .thenReturn(testCallResponse);
            PageResponse<CallResponse> response = callService.getAllCallHistory(page, size, testAuthentication);

            assertNotNull(response);
            assertEquals(1, response.getContent().size());
            assertEquals(page, response.getNumber());
            assertEquals(size, response.getSize());
            assertEquals(1, response.getTotalElements());
            assertEquals(1, response.getTotalPages());
            assertTrue(response.isFirst());
            assertTrue(response.isLast());

            verify(callRepository, times(1)).findUserAllCalls(pageable, testUser.getId());
            verify(callMapper, times(1)).toCallResponse(testCall);
        }
    }
}

//  verify().save(argThat(s -> )) // check args before run
// verify(_, never())._()