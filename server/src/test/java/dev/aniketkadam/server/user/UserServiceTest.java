package dev.aniketkadam.server.user;

import dev.aniketkadam.server.call.Call;
import dev.aniketkadam.server.call.CallRepository;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.file.FileUtils;
import dev.aniketkadam.server.profileImg.ProfileImg;
import dev.aniketkadam.server.profileImg.ProfileImgRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private FileUtils fileUtils;
    @Mock
    private ProfileImgRepository profileImgRepository;
    @Mock
    private UserMapper mapper;
    @Mock
    private CallRepository callRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private Authentication testAuthentication;

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
    }

    @Nested
    class CompleteAccountTests {

        @Test
        void shouldCompleteAccountSuccessfully() throws OperationNotPermittedException {
            String fullName = "test user";
            LocalDate birthDate = LocalDate.of(2004, 5, 20);
            MultipartFile profile = mock(MultipartFile.class);

            Map<String, Object> uploadResponse = Map.of(
                    "secure_url", "https://store/imgae.jpg",
                    "public_id", "image-123"
            );

            when(fileUtils.uploadProfileImage(profile))
                    .thenReturn(uploadResponse);
            when(profileImgRepository.save(any(ProfileImg.class)))
                    .thenAnswer(invocationOnMock -> invocationOnMock.getArgument(0));
            when(userRepository.save(any(User.class)))
                    .thenAnswer(invocationOnMock -> invocationOnMock.getArgument(0));

            Boolean result = userService.completeAccount(fullName, birthDate, profile, testAuthentication);

            assertTrue(result);
            assertEquals(fullName, testUser.getFullName());
            assertEquals(birthDate, testUser.getBirthDate());
            assertEquals(uploadResponse.get("secure_url"), testUser.getProfile().getProfileUrl());
            assertEquals(uploadResponse.get("public_id"), testUser.getProfile().getPublicId());
            assertTrue(testUser.isAccountCompleted());

            verify(fileUtils, times(1))
                    .uploadProfileImage(profile);
            verify(profileImgRepository, times(1))
                    .save(argThat(pro ->
                            pro.getProfileUrl().equals(uploadResponse.get("secure_url")) &&
                                    pro.getPublicId().equals(uploadResponse.get("public_id"))
                            )
                    );
            verify(userRepository, times(1))
                    .save(argThat(user ->
                            user.getId().equals(testUser.getId())
                            )
                    );
        }

        @Test
        void shouldCompleteAccountWithoutProfileSuccessfully() throws OperationNotPermittedException {
            String fullName = "test user";
            LocalDate birthDate = LocalDate.of(2004, 5, 20);

            when(userRepository.save(any(User.class)))
                    .thenAnswer(invocationOnMock -> invocationOnMock.getArgument(0));

            Boolean result = userService.completeAccount(fullName, birthDate, null, testAuthentication);

            assertTrue(result);
            assertEquals(fullName, testUser.getFullName());
            assertEquals(birthDate, testUser.getBirthDate());
            assertTrue(testUser.isAccountCompleted());

            verify(userRepository, times(1))
                    .save(argThat(user ->
                                    user.getId().equals(testUser.getId())
                            )
                    );
        }

        @Test
        void shouldNotOverrideUserDataWhenAccountAlreadyCompleted() throws OperationNotPermittedException {
            String fullName = "new name";
            LocalDate birthDate = LocalDate.of(2002, 2, 22);

            testUser.setAccountCompleted(true);
            testUser.setFullName("test user");
            testUser.setBirthDate(LocalDate.of(2004, 5, 20));

            when(userRepository.save(any(User.class)))
                    .thenAnswer(invocationOnMock -> invocationOnMock.getArgument(0));

            Boolean result = userService.completeAccount(fullName, birthDate, null, testAuthentication);

            assertTrue(result);
            assertNotEquals(fullName,"test user");
            assertNotEquals(birthDate, LocalDate.of(2004, 5, 20));
            assertTrue(testUser.isAccountCompleted());

            verify(userRepository, times(1))
                    .save(argThat(user ->
                                    user.getId().equals(testUser.getId())
                            )
                    );
        }
    }

    @Nested
    class FetchUserByTokenTests {

        @Test
        void shouldFetchUserByTokenSuccessfully() {
            when(mapper.toUserResponse(any(User.class)))
                    .thenReturn(UserResponse.builder()
                            .id(testUser.getId())
                            .email(testUser.getEmail())
                            .build()
                    );
            UserResponse result = userService.fetchUserByToken(testAuthentication);

            assertEquals(testUser.getId(), result.getId());
            assertEquals(testUser.getEmail(), result.getEmail());

            verify(mapper, times(1))
                    .toUserResponse(testUser);
        }
    }

    @Nested
    class FetchSuggestedUsersTests {

        @Test
        void shouldFetchSuggestedUsersSuccessfully() {
            int size = 2;

            User user2 = User.builder()
                    .id("user-2")
                    .email("u2@test.com")
                    .build();
            User user3 = User.builder()
                    .id("user-3")
                    .email("u3@test.com")
                    .build();

            Call call1 = Call.builder()
                    .caller(testUser)
                    .receiver(user2)
                    .build();

            Call call2 = Call.builder()
                    .caller(user3)
                    .receiver(testUser)
                    .build();

            when(callRepository.findUserByCallerIdOrReceiverId(testUser.getId()))
                    .thenReturn(List.of(call1, call2));

            when(mapper.toUserResponse(any(User.class)))
                    .thenAnswer(inv -> {
                        User u = inv.getArgument(0);
                        return UserResponse.builder()
                                .id(u.getId())
                                .email(u.getEmail())
                                .build();
                    });

            List<UserResponse> result =
                    userService.fetchSuggestedUsers(size, testAuthentication);

            assertEquals(2, result.size());
            assertEquals("user-2", result.get(0).getId());
            assertEquals("user-3", result.get(1).getId());

            verify(callRepository, times(1))
                    .findUserByCallerIdOrReceiverId(anyString());
            verify(mapper, times(2))
                    .toUserResponse(any(User.class));
        }

        @Test
        void shouldLimitSuggestedUsersBySize() {
            User user2 = User.builder()
                    .id("user-2")
                    .build();
            User user3 = User.builder()
                    .id("user-3")
                    .build();

            when(callRepository.findUserByCallerIdOrReceiverId(testUser.getId()))
                    .thenReturn(List.of(
                            Call.builder().caller(testUser).receiver(user2).build(),
                            Call.builder().caller(testUser).receiver(user3).build()
                    ));

            when(mapper.toUserResponse(any()))
                    .thenReturn(UserResponse.builder().build());

            List<UserResponse> result =
                    userService.fetchSuggestedUsers(1, testAuthentication);

            assertEquals(1, result.size());

            verify(callRepository, times(1))
                    .findUserByCallerIdOrReceiverId(anyString());
            verify(mapper, times(1))
                    .toUserResponse(any(User.class));
        }

        @Test
        void shouldReturnEmptyListWhenNoPreviousCalls() {
            when(callRepository.findUserByCallerIdOrReceiverId(testUser.getId()))
                    .thenReturn(List.of());

            List<UserResponse> result =
                    userService.fetchSuggestedUsers(5, testAuthentication);

            assertTrue(result.isEmpty());

            verify(callRepository, times(1))
                    .findUserByCallerIdOrReceiverId(anyString());
            verify(mapper, never())
                    .toUserResponse(any(User.class));
        }
    }

    @Nested
    class FetchSearchUserTests {

        @Test
        void shouldFetchSearchUsersSuccessfully() {
            String keyword = "test";
            int size = 5;

            User user2 = User.builder()
                    .id("user-2")
                    .email("u2@test.com")
                    .build();
            User user3 = User.builder()
                    .id("user-3")
                    .email("u3@test.com")
                    .build();

            when(userRepository.searchByFullNameOrPhoneOrEmail(keyword, size))
                    .thenReturn(List.of(testUser, user2, user3));

            when(mapper.toUserResponse(any(User.class)))
                    .thenAnswer(inv -> {
                        User u = inv.getArgument(0);
                        return UserResponse.builder()
                                .id(u.getId())
                                .email(u.getEmail())
                                .build();
                    });

            List<UserResponse> result =
                    userService.fetchSearchUser(keyword, size, testAuthentication);

            assertEquals(2, result.size());
            assertTrue(result.stream().noneMatch(u -> u.getId().equals("user-123")));

            verify(userRepository, times(1))
                    .searchByFullNameOrPhoneOrEmail(anyString(), anyInt());
            verify(mapper, times(result.size()))
                    .toUserResponse(any(User.class));
        }

        @Test
        void shouldReturnEmptyListWhenOnlyConnectedUserFound() {
            when(userRepository.searchByFullNameOrPhoneOrEmail(any(), any()))
                    .thenReturn(List.of(testUser));

            List<UserResponse> result =
                    userService.fetchSearchUser("test", 5, testAuthentication);

            assertTrue(result.isEmpty());

            verify(userRepository, times(1))
                    .searchByFullNameOrPhoneOrEmail(anyString(), anyInt());
            verify(mapper, never())
                    .toUserResponse(any(User.class));
        }

        @Test
        void shouldReturnEmptyListWhenNoUsersFound() {
            when(userRepository.searchByFullNameOrPhoneOrEmail(any(), any()))
                    .thenReturn(List.of());

            List<UserResponse> result =
                    userService.fetchSearchUser("unknown", 5, testAuthentication);

            assertTrue(result.isEmpty());

            verify(userRepository, times(1))
                    .searchByFullNameOrPhoneOrEmail(anyString(), anyInt());
            verify(mapper, never())
                    .toUserResponse(any(User.class));
        }
    }

    @Nested
    class FetchUserByIdTests {

        @Test
        void shouldFetchUserByIdSuccessfully() throws OperationNotPermittedException {
            User otherUser = User.builder()
                    .id("user-2")
                    .email("user2@test.com")
                    .build();

            when(userRepository.findById("user-2"))
                    .thenReturn(Optional.of(otherUser));

            when(mapper.toUserResponse(otherUser))
                    .thenReturn(UserResponse.builder()
                            .id("user-2")
                            .email("user2@test.com")
                            .build());

            UserResponse response =
                    userService.fetchUserById("user-2", testAuthentication);

            assertNotNull(response);
            assertEquals("user-2", response.getId());

            verify(userRepository, times(1))
                    .findById(anyString());
            verify(mapper, times(1))
                    .toUserResponse(any());
        }

        @Test
        void shouldThrowExceptionWhenUserNotFound() {
            when(userRepository.findById("missing-id"))
                    .thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class, () ->
                    userService.fetchUserById("missing-id", testAuthentication));
        }

        @Test
        void shouldThrowExceptionWhenFetchingOwnUser() {
            when(userRepository.findById("user-1"))
                    .thenReturn(Optional.of(testUser));

            OperationNotPermittedException exception = assertThrows(OperationNotPermittedException.class, () ->
                    userService.fetchUserById("user-1", testAuthentication));

            assertEquals("User not fetch there own details by Id", exception.getMessage());
        }
    }

    @Nested
    class FetchUserByEmailTests {

        @Test
        void shouldFetchUserByEmailSuccessfully() {
            String email = "user@test.com";

            User user = User.builder()
                    .id("user-1")
                    .email(email)
                    .build();

            UserResponse response = UserResponse.builder()
                    .id("user-1")
                    .email(email)
                    .build();

            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(user));
            when(mapper.toUserResponse(user))
                    .thenReturn(response);

            UserResponse result = userService.fetchUserByEmail(email);

            assertNotNull(result);
            assertEquals(email, result.getEmail());

            verify(userRepository, times(1)).findByEmail(email);
            verify(mapper, times(1)).toUserResponse(user);
        }

        @Test
        void shouldThrowExceptionWhenEmailNotFound() {
            String email = "missing@test.com";

            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.empty());

            EntityNotFoundException exception =
                    assertThrows(EntityNotFoundException.class,
                            () -> userService.fetchUserByEmail(email));

            assertTrue(exception.getMessage().contains(email));

            verifyNoInteractions(mapper);
        }
    }
}
