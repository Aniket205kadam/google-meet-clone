package dev.aniketkadam.server.user;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerTests {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Nested
    class CompleteAccountTests {
        @Test
        @WithMockUser(username = "user@test.com")
        void shouldCompleteAccountSuccessfully() throws Exception {

            MockMultipartFile profile =
                    new MockMultipartFile(
                            "profile",
                            "profile.jpg",
                            "image/jpeg",
                            "dummy-image-content".getBytes()
                    );

            when(userService.completeAccount(
                    anyString(),
                    any(LocalDate.class),
                    any(MultipartFile.class),
                    any(Authentication.class)
            )).thenReturn(true);

            mockMvc.perform(
                            multipart("/api/v1/users/account/complete")
                                    .file(profile)
                                    .param("fullName", "Test User")
                                    .param("birthDate", "2004-05-20")
                                    .with(csrf())
                    )
                    .andExpect(status().isOk())
                    .andExpect(content().string("true"));
        }

        @Test
        @WithMockUser(username = "user@test.com")
        void shouldCompleteAccountWithoutOptionalFields() throws Exception {

            when(userService.completeAccount(
                    anyString(),
                    isNull(),
                    isNull(),
                    any(Authentication.class)
            )).thenReturn(true);

            mockMvc.perform(
                            multipart("/api/v1/users/account/complete")
                                    .param("fullName", "Test User")
                                    .with(csrf())
                    )
                    .andExpect(status().isOk())
                    .andExpect(content().string("true"));
        }

        @Test
        @WithMockUser
        void shouldReturnForbidden_whenOperationNotPermitted() throws Exception {

            when(userService.completeAccount(
                    anyString(),
                    any(),
                    any(),
                    any(Authentication.class)
            )).thenThrow(new OperationNotPermittedException("Not allowed"));

            mockMvc.perform(
                            multipart("/api/v1/users/account/complete")
                                    .param("fullName", "Test User")
                                    .with(csrf())
                    )
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    class FetchUserByIdTests {

        @Test
        @WithMockUser("user@test.com")
        void shouldFetchUserSuccessfully() throws Exception {
            String userId = "user-1";
            UserResponse response = UserResponse.builder()
                    .id("user-1")
                    .fullName("test user1")
                    .email("user1@test.com")
                    .build();

            when(userService.fetchUserByToken(any(Authentication.class)))
                    .thenReturn(response);

            mockMvc.perform(
                    get("/api/v1/users/fetch-user")
            )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("user1@test.com"))
                    .andExpect(jsonPath("$.fullName").value("test user1"))
                    .andExpect(jsonPath("$.id").value(userId));
        }

        @Test
        void shouldReturnUnauthorized_whenUserNotAuthenticated() throws Exception {
            mockMvc.perform(
                    get("/api/v1/users/fetch-user")
            )
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class GetSuggestedUsersTests {

        @Test
        @WithMockUser("user@test.com")
        void shouldGetSuggestedUsersSuccessfully() throws Exception {
            List<UserResponse> response = List.of(
                    UserResponse.builder()
                            .id("user-1")
                            .fullName("test user1")
                            .email("user1@test.com")
                            .build(),
                    UserResponse.builder()
                            .id("user-2")
                            .fullName("test user2")
                            .email("user2@test.com")
                            .build()
            );

            when(userService.fetchSuggestedUsers(eq(2), any(Authentication.class)))
                    .thenReturn(response);

            mockMvc.perform(
                    get("/api/v1/users/suggested-users")
                            .param("size", "2")
            )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].email").value("user1@test.com"));
        }

        @Test
        @WithMockUser
        void shouldGetSuggested_whenUseDefaultSize() throws Exception {
            when(userService.fetchSuggestedUsers(eq(9), any(Authentication.class)))
                    .thenReturn(List.of());

            mockMvc.perform(
                    get("/api/v1/users/suggested-users")
            )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));

        }

        @Test
        void shouldReturnUnauthorized_whenNotAuthenticated() throws Exception {
            mockMvc.perform(
                    get("/api/v1/users/suggested-users")
            )
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class GetSearchUsersTest {

        @Test
        @WithMockUser("user@test.com")
        void shouldGetSearchUsersSuccessfully() throws Exception {
            String keyword = "test";
            List<UserResponse> response = List.of(
                    UserResponse.builder()
                            .id("user-1")
                            .fullName("test user1")
                            .email("user1@test.com")
                            .build(),
                    UserResponse.builder()
                            .id("user-2")
                            .fullName("test user2")
                            .email("user2@test.com")
                            .build()
            );

            when(userService.fetchSearchUser(
                    eq("test"),
                    eq(2),
                    any(Authentication.class))
            ).thenReturn(response);

            mockMvc.perform(
                    get("/api/v1/users/search")
                            .param("keyword", keyword)
                            .param("size", "2")
            )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].email").value("user1@test.com"));
        }

        @Test
        @WithMockUser(username = "user@test.com")
        void shouldGetSearchUsers_whenUseDefaultSize() throws Exception {
            when(userService.fetchSearchUser(eq("test"), eq(9), any(Authentication.class)))
                    .thenReturn(List.of());

            mockMvc.perform(
                    get("/api/v1/users/search")
                            .param("keyword", "test")
            )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }

        @Test
        void shouldReturnUnauthenticated_whenNotAuthenticated() throws Exception {
            mockMvc.perform(
                    get("/api/v1/users/search")
                            .param("keyword", "test")
            )
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class GetUserByIdTests {

        @Test
        @WithMockUser
        void shouldGetUserByIdSuccessfully() throws Exception {
            String userId = "user-1";
            UserResponse response = UserResponse.builder()
                    .id(userId)
                    .fullName("test user1")
                    .email("user1@test.com")
                    .build();

            when(userService.fetchUserById(eq("user-1"), any(Authentication.class)))
                    .thenReturn(response);

            mockMvc.perform(
                    get("/api/v1/users/u/" + userId)
            )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.fullName").value("test user1"))
                    .andExpect(jsonPath("$.email").value("user1@test.com"));
        }

        @Test
        @WithMockUser
        void shouldReturnException_whenUserTryFetchOwnDetails() throws Exception {
            String userId = "user-1";
            String exceptionMsg = "User not fetch there own details by Id";

            when(userService.fetchUserById(anyString(), any(Authentication.class)))
                    .thenThrow(new OperationNotPermittedException(exceptionMsg));

            mockMvc.perform(
                    get("/api/v1/users/u/" + userId)
            )
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(exceptionMsg));
        }

        @Test
        void shouldReturnUnauthenticated_whenNotAuthenticated() throws Exception {
            mockMvc.perform(
                            get("/api/v1/users/u/any-id")
                                    .param("keyword", "test")
                    )
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class GetUserByEmailTests {

        @Test
        @WithMockUser
        void shouldGetUserByEmailSuccessfully() throws Exception {
            String email = "user@test.com";
            UserResponse response = UserResponse.builder()
                    .id("user-1")
                    .fullName("test user1")
                    .email(email)
                    .build();

            when(userService.fetchUserByEmail(eq("user@test.com")))
                    .thenReturn(response);

            mockMvc.perform(
                    get("/api/v1/users/email/" + email)
            )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value("user-1"))
                    .andExpect(jsonPath("$.fullName").value("test user1"))
                    .andExpect(jsonPath("$.email").value("user@test.com"));
        }

        @Test
        void shouldReturnUnauthenticated_whenNotAuthenticated() throws Exception {
            mockMvc.perform(
                            get("/api/v1/users/email/any@email.com")
                                    .param("keyword", "test")
                    )
                    .andExpect(status().isUnauthorized());
        }
    }
}
