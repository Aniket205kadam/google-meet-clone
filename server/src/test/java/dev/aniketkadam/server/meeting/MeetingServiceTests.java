package dev.aniketkadam.server.meeting;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.user.User;
import dev.aniketkadam.server.user.UserMapper;
import dev.aniketkadam.server.user.UserRepository;
import dev.aniketkadam.server.user.UserResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Meeting Service Tests")
@ActiveProfiles("test")
class MeetingServiceTests {

    @Mock
    private MeetingRepository meetingRepository;
    @Mock
    private MeetingMapper meetingMapper;
    @Mock
    private MeetingParticipantRepository meetingParticipantRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private UserMapper userMapper;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MeetingService meetingService;

    private User testUser;
    private Authentication testAuthentication;
    private Meeting testSavedMeeting;

    @BeforeEach
    void setup() {
        this.testUser = User.builder()
                .id("user-123")
                .email("user@test.com")
                .build();
        this.testAuthentication = new UsernamePasswordAuthenticationToken(
                testUser,
                null,
                Collections.emptyList()
        );
        this.testSavedMeeting = Meeting.builder()
                .id("meeting-123")
                .meetingCode("abc-defg-hij")
                .meetingParticipants(new HashSet<>())
                .allowedUsers(new HashSet<>())
                .waitingUsers(new HashSet<>())
                .createdBy(testUser)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("Create Meeting Tests")
    class CreateMeetingTests {

        @Test
        @DisplayName("Should create meeting successfully")
        void shouldCreateMeetingSuccessfully() {
            when(MeetingServiceTests.this.meetingRepository.save(any(Meeting.class)))
                    .thenReturn(testSavedMeeting);

            String meetingCode = meetingService.createMeeting(testAuthentication);

            assertNotNull(meetingCode);
            assertEquals(testSavedMeeting.getMeetingCode(), meetingCode);

            verify(meetingRepository, times(1)).save(argThat(meeting ->
                    meeting.getCreatedBy().getEmail().equals(testSavedMeeting.getCreatedBy().getEmail())
            ));
        }
    }

    @Nested
    @DisplayName("Is Admin Tests")
    class IsAdminTests {

        @Test
        @DisplayName("Should return true successfully when authenticated user is meeting creator")
        void shouldReturnTrue_whenAuthenticatedUserIsMeetingCreator() {
            String meetingCode = "abc-defg-hij";

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));

            Boolean result = meetingService.isAdmin(meetingCode, testAuthentication);

            assertNotNull(result);
            assertEquals(true, result);

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
        }

        @Test
        @DisplayName("Should return false successfully when authenticated user is not meeting creator")
        void shouldReturnFalse_whenAuthenticatedUserIsNotMeetingCreator() {
            String meetingCode = "abc-defg-hij";
            User outsiderUser = User.builder()
                    .id("outsider-123")
                    .email("outsider@test.com")
                    .build();
            Authentication testOutsiderAuth = new UsernamePasswordAuthenticationToken(
                    outsiderUser,
                    null,
                    Collections.emptyList()
            );

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));

            Boolean result = meetingService.isAdmin(meetingCode, testOutsiderAuth);

            assertNotNull(result);
            assertEquals(false, result);

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
        }

        @Test
        @DisplayName("Should throw exception successfully when meeting code does not exists")
        void shouldThrowException_whenMeetingCodeDoesNotExist() {
            String meetingCode = "abc-defg-hij";

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> meetingService.isAdmin(meetingCode, testAuthentication)
            );

            assertNotNull(exception);
            assertEquals("Meeting is not found with code: " + meetingCode, exception.getMessage());

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
        }
    }

    @Nested
    @DisplayName("Get Meeting Participants Tests")
    class GetMeetingParticipantsTests {

        @Test
        @DisplayName("Should get meeting participants successfully")
        void shouldGetMeetingParticipantsSuccessfully() {
            String meetingCode = "abc-defg-hij";
            User testParticipant = User.builder()
                    .id("user-234")
                    .email("participant1@test.com")
                    .build();
            MeetingParticipant testMeetingParticipant = MeetingParticipant.builder()
                    .id("participant-123")
                    .user(testParticipant)
                    .build();
            MeetingParticipant testSelfParticipant = MeetingParticipant.builder()
                    .id("participant-234")
                    .user(testUser)
                    .build();

            testSavedMeeting.setMeetingParticipants(Set.of(testMeetingParticipant, testSelfParticipant));

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));
            when(meetingMapper.toMeetingParticipantResponse(testMeetingParticipant))
                    .thenReturn(MeetingParticipantResponse.builder()
                            .id(testMeetingParticipant.getId())
                            .user(UserResponse.builder()
                                    .id(testMeetingParticipant.getUser().getId())
                                    .email(testMeetingParticipant.getUser().getEmail())
                                    .build()
                            )
                            .build()
                    );
            List<MeetingParticipantResponse> result = meetingService.getMeetingParticipants(meetingCode, testAuthentication);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(
                    testMeetingParticipant.getUser().getId(),
                    result.getFirst().getUser().getId()
            );

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
            verify(meetingMapper, times(1))
                    .toMeetingParticipantResponse(any(MeetingParticipant.class));
        }

        @Test
        @DisplayName("Should throw exception successfully when meeting is not found by meeting code")
        void shouldThrowException_whenMeetingIsNotFoundByCode() {
            String meetingCode = "abc-gfha-qus";

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> meetingService.getMeetingParticipants(meetingCode, testAuthentication)
            );

            assertNotNull(exception);
            assertEquals("Meeting is not found with code: " + meetingCode, exception.getMessage());

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
            verifyNoInteractions(meetingMapper);
        }

        @Test
        @DisplayName("Should return empty list successfully when only creator has join the meeting")
        void shouldReturnEmptyList_whenOnlyCreatorJoinMeeting() {
            String meetingCode = "abc-defg-hij";
            MeetingParticipant testSelfMeetingParticipant = MeetingParticipant.builder()
                    .id("participant-123")
                    .user(testUser).build();

            testSavedMeeting.setMeetingParticipants(Set.of(testSelfMeetingParticipant));

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));

            List<MeetingParticipantResponse> result = meetingService.getMeetingParticipants(meetingCode, testAuthentication);

            assertNotNull(result);
            assertTrue(result.isEmpty());

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
            verify(meetingMapper, never())
                    .toMeetingParticipantResponse(any(MeetingParticipant.class));
        }
    }

    @Nested
    @DisplayName("Add User In Meeting Tests")
    class AddUserInMeetingTests {

        @Test
        @DisplayName("Should add participant successfully when creator joins")
        void shouldAddParticipant_whenCreatorJoins() throws Exception {
            String meetingCode = "abc-adse-erf";
            MeetingParticipant savedParticipant = MeetingParticipant.builder()
                    .user(testUser)
                    .meeting(testSavedMeeting)
                    .build();

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));
            when(meetingParticipantRepository.save(any()))
                    .thenReturn(savedParticipant);
            when(meetingMapper.toMeetingParticipantResponse(savedParticipant))
                    .thenReturn(MeetingParticipantResponse.builder().build());

            meetingService.addUserInMeeting(meetingCode, testAuthentication);

            verify(meetingParticipantRepository).save(any(MeetingParticipant.class));
            verify(messagingTemplate).convertAndSend(
                    eq("/topic/meeting/" + meetingCode + "/participant/add"),
                    any(MeetingParticipantResponse.class)
            );
        }

        @Test
        @DisplayName("Should add participant successfully when allowed user joins")
        void shouldAddParticipant_whenAllowedUserJoins() throws Exception {
            String meetingCode = "abc-adse-erf";
            var requestToAddInMeeting = User.builder()
                    .id("user-987")
                    .email("user987@test.com")
                    .build();
            testSavedMeeting.setAllowedUsers(Set.of(requestToAddInMeeting));

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));
            when(meetingParticipantRepository.save(any()))
                    .thenReturn(MeetingParticipant.builder()
                            .id("new-participant-123")
                            .user(requestToAddInMeeting)
                            .build());
            when(meetingMapper.toMeetingParticipantResponse(any(MeetingParticipant.class)))
                    .thenReturn(MeetingParticipantResponse.builder().build());

            meetingService.addUserInMeeting(meetingCode, new UsernamePasswordAuthenticationToken(requestToAddInMeeting, null, Collections.emptyList()));

            verify(meetingParticipantRepository).save(any(MeetingParticipant.class));
            verify(messagingTemplate).convertAndSend(
                    eq("/topic/meeting/" + meetingCode + "/participant/add"),
                    any(MeetingParticipantResponse.class)
            );
        }

        @Test
        @DisplayName("Should throw exception successfully when meeting not found")
        void shouldThrowException_whenMeetingNotFound() {
            String meetingCode = "abc-ajdh-qwm";

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> meetingService.addUserInMeeting(meetingCode, testAuthentication)
            );

            assertNotNull(exception);
            assertEquals("Meeting is not found with ID: " + meetingCode, exception.getMessage());

            verifyNoInteractions(meetingParticipantRepository, meetingMapper, messagingTemplate);
        }

        @Test
        @DisplayName("Should throw exception successfully when user has no permission")
        void shouldThrowException_whenUserHasNoPermission() {
            String meetingCode = "abc-ajdh-qwm";
            var randomUser = User.builder()
                    .id("random-123")
                    .email("random@test.com")
                    .build();

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));

            OperationNotPermittedException exception =
                    assertThrows(OperationNotPermittedException.class, () ->
                            meetingService.addUserInMeeting(meetingCode, new UsernamePasswordAuthenticationToken(randomUser, null, Collections.emptyList()))
                    );

            assertNotNull(exception);
            assertEquals("You don't have permission to join the meeting", exception.getMessage());
            verifyNoInteractions(meetingParticipantRepository, meetingMapper, messagingTemplate);
        }

        @Test
        @DisplayName("Should throw exception successfully when user already participant")
        void shouldThrowException_whenUserAlreadyParticipant() {
            String meetingCode = "abc-ajdh-qwm";

            testSavedMeeting.getMeetingParticipants()
                    .add(
                        MeetingParticipant.builder()
                            .id("participant-123")
                            .user(testUser)
                            .build()
                    );

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));

            OperationNotPermittedException exception = assertThrows(
                    OperationNotPermittedException.class,
                    () -> meetingService.addUserInMeeting(meetingCode, testAuthentication)
            );

            assertNotNull(exception);
            assertEquals("You are already present in the participants list.", exception.getMessage());
            verifyNoInteractions(meetingParticipantRepository, meetingMapper, messagingTemplate);
        }
    }

    @Nested
    @DisplayName("Get Admin Permission Tests")
    class GetAdminPermissionTests {

        @Test
        void shouldAddUserToWaitingList_andNotifyAdmin() {
            User newUser = User.builder()
                    .id("new-user-123")
                    .email("newUser123@test.com")
                    .build();
            UserResponse response = UserResponse.builder()
                    .id(newUser.getId())
                    .email(newUser.getEmail())
                    .build();

            when(meetingRepository.findByMeetingCode("abc-efgh-ijq"))
                    .thenReturn(Optional.of(testSavedMeeting));
            when(userMapper.toUserResponse(newUser))
                    .thenReturn(response);

            meetingService.getAdminPermission("abc-efgh-ijq", new UsernamePasswordAuthenticationToken(newUser, null, Collections.emptyList()));

            assertTrue(testSavedMeeting.getWaitingUsers().contains(newUser));

            verify(meetingRepository, times(1)).save(any());
            verify(messagingTemplate).convertAndSend(
                    eq("/topic/waiting/users/abc-efgh-ijq/" + testSavedMeeting.getCreatedBy().getEmail()),
                    any(UserResponse.class)
            );
        }

        @Test
        void shouldThrowException_whenMeetingNotFound() {
            when(meetingRepository.findByMeetingCode("abc-efgh-ijq"))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> meetingService.getAdminPermission("abc-efgh-ijq", testAuthentication)
            );

            assertEquals("Meeting is not found with ID: abc-efgh-ijq", exception.getMessage());

            verifyNoInteractions(messagingTemplate, userMapper);
        }
    }

    @Nested
    @DisplayName("Generate Permission To Users Tests")
    class GeneratePermissionToUsersTests {

        @Test
        @DisplayName("Should generate permission for users successfully")
        void shouldGeneratePermissionForUsersSuccessfully() throws OperationNotPermittedException {
            List<String> userIds = List.of("user-1", "user-2");

            var waitingUser1 = User.builder()
                    .id("user-1")
                    .email("user1@test.com")
                    .build();
            var waitingUser2 = User.builder()
                    .id("user-2")
                    .email("user2@test.com")
                    .build();

            when(meetingRepository.findByMeetingCode("abc-efgh-ijq"))
                    .thenReturn(Optional.of(testSavedMeeting));
            when(userRepository.findById("user-1"))
                    .thenReturn(Optional.of(waitingUser1));
            when(userRepository.findById("user-2"))
                    .thenReturn(Optional.of(waitingUser2));

            meetingService.generatePermissionToUsers(
                    "abc-efgh-ijq",
                    testAuthentication,
                    userIds
            );

            assertEquals(2, testSavedMeeting.getAllowedUsers().size());
            assertTrue(testSavedMeeting.getAllowedUsers().contains(waitingUser1));
            assertTrue(testSavedMeeting.getAllowedUsers().contains(waitingUser2));
            assertTrue(testSavedMeeting.getWaitingUsers().isEmpty());

            verify(meetingRepository, times(1)).save(testSavedMeeting);

            verify(messagingTemplate, times(1)).convertAndSend(
                    eq("/topic/allowed/in/meeting/abc-efgh-ijq/user-1"),
                    eq("user-1")
            );
            verify(messagingTemplate, times(1)).convertAndSend(
                    eq("/topic/allowed/in/meeting/abc-efgh-ijq/user-2"),
                    eq("user-2")
            );
        }

        @Test
        @DisplayName("Should throw exception successfully when user is not admin")
        void shouldThrowException_whenUserIsNotAdmin() {
            User nonAdmin = User.builder()
                    .id("user-x")
                    .email("userx@test.com")
                    .build();

            when(meetingRepository.findByMeetingCode("abc-efgh-ijq"))
                    .thenReturn(Optional.of(testSavedMeeting));

            OperationNotPermittedException exception = assertThrows(
                    OperationNotPermittedException.class,
                    () -> meetingService.generatePermissionToUsers(
                            "abc-efgh-ijq",
                            new UsernamePasswordAuthenticationToken(nonAdmin, null, Collections.emptyList()),
                            List.of("user-1")
                    )
            );

            assertEquals("Only admin of the meeting can generate permission", exception.getMessage());

            verifyNoInteractions(userRepository, messagingTemplate);
        }

        @Test
        @DisplayName("Should throw exception successfully when meeting not found")
        void shouldThrowException_whenMeetingNotFound() {
            when(meetingRepository.findByMeetingCode("abc-efgh-ijq"))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> meetingService.generatePermissionToUsers(
                            "abc-efgh-ijq",
                            testAuthentication,
                            List.of("user-1")
                    )
            );

            assertEquals("Meeting is not found with ID: abc-efgh-ijq", exception.getMessage());

            verifyNoInteractions(userRepository, messagingTemplate);
        }
    }

    @Nested
    @DisplayName("Has Permission To Join Tests")
    class HasPermissionToJoinTests {

        @Test
        @DisplayName("Should return true when user is admin")
        void shouldReturnTrue_whenUserIsAdmin() {
            String meetingCode = "abc-hsgd-wue";

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));

            Boolean result = meetingService.hasPermissionToJoin(meetingCode, testAuthentication);

            assertTrue(result);

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
        }

        @Test
        @DisplayName("Should return true when user is allowed by admin")
        void shouldReturnTrue_whenUserIsAllowedUser() {
            String meetingCode = "abc-hsgd-wue";
            var allowedUser = User.builder()
                    .id("allowed-user-1")
                    .email("allowedUser1@test.com")
                    .build();

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));

            testSavedMeeting.setAllowedUsers(Set.of(allowedUser));

            Boolean result = meetingService.hasPermissionToJoin(
                    meetingCode,
                    new UsernamePasswordAuthenticationToken(allowedUser, null, Collections.emptyList())
            );

            assertTrue(result);

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
        }

        @Test
        @DisplayName("Should return false when user is not allowed")
        void shouldReturnFalse_whenUserIsNotAllowedUser() {
            String meetingCode = "abc-hsgd-wue";
            var unkownUser = User.builder()
                    .id("allowed-user-1")
                    .email("allowedUser1@test.com")
                    .build();

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));

            Boolean result = meetingService.hasPermissionToJoin(
                    meetingCode,
                    new UsernamePasswordAuthenticationToken(unkownUser, null, Collections.emptyList())
            );

            assertFalse(result);

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
        }

        @Test
        @DisplayName("Should throw exception successfully when meeting not found by Id")
        void shouldThrowException_whenMeetingNotFoundById() {
            String meetingCode = "abc-hsgd-wue";

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> meetingService.hasPermissionToJoin(meetingCode, testAuthentication)
            );

            assertEquals("Meeting is not found with ID: " + meetingCode, exception.getMessage());
        }
    }

    @Nested
    class GetWaitingUsersTests {

        @Test
        void shouldReturnWaitingUsers_whenUserIsAdmin() throws OperationNotPermittedException {
            String meetingCode = "ahd-ahds-eur";

            var waitingUser1 = User.builder()
                    .id("user-1")
                    .email("user1@test.com")
                    .build();
            var waitingUser2 = User.builder()
                    .id("user-2")
                    .email("user2@test.com")
                    .build();

            testSavedMeeting.setWaitingUsers(Set.of(waitingUser1, waitingUser2));

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));
            when(userMapper.toUserResponse(waitingUser1))
                    .thenReturn(UserResponse.builder()
                            .id(waitingUser1.getId())
                            .email(waitingUser1.getEmail())
                            .build()
                    );
            when(userMapper.toUserResponse(waitingUser2))
                    .thenReturn(UserResponse.builder()
                            .id(waitingUser2.getId())
                            .email(waitingUser2.getEmail())
                            .build()
                    );

            List<UserResponse> result = meetingService.getWaitingUsers(meetingCode, testAuthentication);

            assertEquals(2, result.size());
            assertTrue(result.stream()
                    .allMatch(wu ->
                            Objects.equals(wu.getId(), waitingUser1.getId()) ||
                                    Objects.equals(wu.getId(), waitingUser2.getId())
                    )
            );

            verify(meetingRepository, times(1))
                    .findByMeetingCode(anyString());
            verify(userMapper, times(2))
                    .toUserResponse(any(User.class));
        }

        @Test
        void shouldThrowException_whenUserIsNotAdmin() {
            String meetingCode = "ahd-ahds-eur";
            User nonAdmin = User.builder()
                    .id("user-x")
                    .email("userx@test.com")
                    .build();

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));

            OperationNotPermittedException exception = assertThrows(
                    OperationNotPermittedException.class,
                    () -> meetingService.getWaitingUsers(meetingCode, new UsernamePasswordAuthenticationToken(nonAdmin, null, Collections.emptyList()))
            );

            assertEquals("Only admin of the meeting can see waiting users.", exception.getMessage());

            verifyNoInteractions(userMapper);
        }

        @Test
        void shouldThrowException_whenMeetingNotFoundById() {
            String meetingCode = "ajs-fhds-wue";

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> meetingService.getWaitingUsers(meetingCode, testAuthentication)
            );

            assertEquals("Meeting is not found with ID: " + meetingCode, exception.getMessage());

            verifyNoInteractions(userMapper);
        }
    }

    @Nested
    class GetMeetingParticipantsAllTests {

        @Test
        void shouldGetMeetingParticipantsSuccessfully() {
            String meetingCode = "abc-ahsf-hgf";

            MeetingParticipant meetingParticipant1 = MeetingParticipant.builder()
                    .id("participant-1")
                    .user(User.builder()
                            .id("user-2")
                            .email("user2@test.com")
                            .build()
                    )
                    .build();
            MeetingParticipant meetingParticipant2 = MeetingParticipant.builder()
                    .id("participant-2")
                    .user(User.builder()
                            .id("user-3")
                            .email("user3@test.com")
                            .build()
                    )
                    .build();
            MeetingParticipant meetingParticipant3 = MeetingParticipant.builder()
                    .id("participant-3")
                    .user(testUser)
                    .build();


            testSavedMeeting.setMeetingParticipants(
                    new LinkedHashSet<>(List.of(meetingParticipant1, meetingParticipant2, meetingParticipant3))
            );

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));
            when(userMapper.toUserResponse(argThat(user -> user != null && user.getId().equals("user-2"))))
                    .thenReturn(UserResponse.builder()
                            .id(meetingParticipant1.getUser().getId())
                            .email(meetingParticipant1.getUser().getEmail())
                            .build()
                    );
            when(userMapper.toUserResponse(argThat(user ->  user != null && user.getId().equals("user-3"))))
                    .thenReturn(UserResponse.builder()
                            .id(meetingParticipant2.getUser().getId())
                            .email(meetingParticipant2.getUser().getEmail())
                            .build()
                    );
            when(userMapper.toUserResponse(testUser))
                    .thenReturn(UserResponse.builder()
                            .id(testUser.getId())
                            .email(testUser.getEmail())
                            .build()
                    );

            List<MeetingParticipantResponse> result = meetingService.getMeetingParticipantsAll(meetingCode, testAuthentication);

            assertEquals(3, result.size());
            assertEquals(testUser.getEmail(), result.getFirst().getUser().getEmail());

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
            verify(userMapper, times(result.size()))
                    .toUserResponse(any(User.class));
        }

        @Test
        void shouldThrowException_whenMeetingNotFoundById() {
            String meetingCode = "ajs-fhds-wue";

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> meetingService.getMeetingParticipantsAll(meetingCode, testAuthentication)
            );

            assertEquals("Meeting is not found with code: " + meetingCode, exception.getMessage());

            verifyNoInteractions(userMapper);
        }
    }

    @Nested
    class IsExistTests {

        @Test
        void shouldReturnTrue_whenMeetingExistsByCode() {
            String meetingCode = "ahd-uerd-ajd";

            when(meetingRepository.existsByMeetingCode(meetingCode))
                    .thenReturn(true);

            Boolean result = meetingService.isExist(meetingCode);

            assertTrue(result);

            verify(meetingRepository, times(1))
                    .existsByMeetingCode(meetingCode);
        }

        @Test
        void shouldReturnFalse_whenMeetingNotExistsByCode() {
            String meetingCode = "ahd-uerd-ajd";

            when(meetingRepository.existsByMeetingCode(meetingCode))
                    .thenReturn(false);

            Boolean result = meetingService.isExist(meetingCode);

            assertFalse(result);

            verify(meetingRepository, times(1))
                    .existsByMeetingCode(meetingCode);
        }
    }

    @Nested
    class RemoveFromMeetingTests {

        @Test
        void shouldRemoveUserFromMeetingSuccessfully() {
            String meetingCode = "ajd-hfgd-ytt";

            MeetingParticipant meetingParticipant1 = MeetingParticipant.builder()
                    .id("participant-1")
                    .user(User.builder()
                            .id("user-2")
                            .email("user2@test.com")
                            .build()
                    )
                    .build();
            MeetingParticipant meetingParticipant2 = MeetingParticipant.builder()
                    .id("participant-2")
                    .user(User.builder()
                            .id("user-3")
                            .email("user3@test.com")
                            .build()
                    )
                    .build();
            MeetingParticipant meetingParticipant3 = MeetingParticipant.builder()
                    .id("participant-3")
                    .user(testUser)
                    .build();


            testSavedMeeting.setMeetingParticipants(
                    new LinkedHashSet<>(List.of(meetingParticipant1, meetingParticipant2, meetingParticipant3))
            );

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));
            when(meetingMapper.toMeetingParticipantResponse(meetingParticipant3))
                    .thenReturn(MeetingParticipantResponse.builder()
                            .id(meetingParticipant3.getId())
                            .user(UserResponse.builder()
                                    .id(meetingParticipant3.getUser().getId())
                                    .email(meetingParticipant3.getUser().getEmail())
                                    .build()
                            )
                            .build());

            meetingService.removeFromMeeting(meetingCode, testAuthentication);

            verify(meetingRepository, times(1))
                    .findByMeetingCode(meetingCode);
            verify(messagingTemplate, times(1))
                    .convertAndSend(
                            eq("/topic/meeting/" + meetingCode + "/participant/remove"),
                            any(MeetingParticipantResponse.class)
                    );
        }

        @Test
        void shouldThrowException_whenUserIsNotExistOnParticipantsLists() {
            String meetingCode = "ajd-hfgd-ytt";

            MeetingParticipant meetingParticipant1 = MeetingParticipant.builder()
                    .id("participant-1")
                    .user(User.builder()
                            .id("user-2")
                            .email("user2@test.com")
                            .build()
                    )
                    .build();
            MeetingParticipant meetingParticipant2 = MeetingParticipant.builder()
                    .id("participant-2")
                    .user(User.builder()
                            .id("user-3")
                            .email("user3@test.com")
                            .build()
                    )
                    .build();

            testSavedMeeting.setMeetingParticipants(
                    new LinkedHashSet<>(List.of(meetingParticipant1, meetingParticipant2))
            );

            when(meetingRepository.findByMeetingCode(meetingCode))
                    .thenReturn(Optional.of(testSavedMeeting));

            IllegalStateException exception = assertThrows(
                    IllegalStateException.class,
                    () -> meetingService.removeFromMeeting(meetingCode, testAuthentication)
            );

            assertEquals("User is not a participant of this meeting", exception.getMessage());

            verify(meetingRepository, never())
                    .save(any(Meeting.class));
            verifyNoInteractions(meetingMapper);
        }
    }
}
