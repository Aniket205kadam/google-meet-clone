package dev.aniketkadam.server.meeting;

import dev.aniketkadam.server.user.UserResponse;
import lombok.SneakyThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class MeetingControllerTests {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    private MeetingService service;

    @Nested
    class CreateMeetingTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldCreateMeetingSuccessfully() {
            when(service.createMeeting(any(Authentication.class)))
                    .thenReturn("meeting-code-1");

            mockMvc.perform(
                    post("/api/v1/meetings")
            )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value("meeting-code-1"));
        }

        @Test
        @SneakyThrows
        void shouldReturnUnauthorized_whenNotAuthenticated() {
            mockMvc.perform(
                    post("/api/v1/meetings")
            )
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class IsAdminTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldReturnTrue_whenUserIsAdmin() {
            when(service.isAdmin(any(String.class), any(Authentication.class)))
                    .thenReturn(true);

            mockMvc.perform(
                            get("/api/v1/meetings/meet-1/is/admin")
                    )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value(true));
        }

        @Test
        @SneakyThrows
        void shouldReturnUnauthorized_whenNotAuthenticated() {
            mockMvc.perform(
                            get("/api/v1/meetings/meet-1/is/admin")
                    )
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class GetParticipantsTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldReturnParticipantsSuccessfully() {
            when(service.getMeetingParticipants(any(String.class), any(Authentication.class)))
                    .thenReturn(List.of(new MeetingParticipantResponse()));

            mockMvc.perform(
                            get("/api/v1/meetings/meet-1/participants")
                    )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }

        @Test
        @SneakyThrows
        void shouldReturnUnauthorized_whenNotAuthenticated() {
            mockMvc.perform(
                            get("/api/v1/meetings/meet-1/participants")
                    )
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class GetParticipantsAllTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldReturnAllParticipantsSuccessfully() {
            when(service.getMeetingParticipantsAll(any(String.class), any(Authentication.class)))
                    .thenReturn(List.of(new MeetingParticipantResponse()));

            mockMvc.perform(
                            MockMvcRequestBuilders.get("/api/v1/meetings/meet-1/participants/all")
                    )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }
    }

    @Nested
    class AdminPermissionTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldRequestAdminPermissionSuccessfully() {
            mockMvc.perform(
                            patch("/api/v1/meetings/meet-1/admin/permission")
                    )
                    .andExpect(status().isOk());
        }
    }

    @Nested
    class GeneratePermissionTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldGeneratePermissionForUsersSuccessfully() {
            mockMvc.perform(
                            patch("/api/v1/meetings/meet-1/add/in/meeting")
                                    .contentType("application/json")
                                    .content("""
                                ["user-1","user-2"]
                                """)
                    )
                    .andExpect(status().isOk());
        }
    }

    @Nested
    class AddUserInMeetingTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldAddUserInMeetingSuccessfully() {
            mockMvc.perform(
                            patch("/api/v1/meetings/meet-1/add")
                    )
                    .andExpect(status().isOk());
        }
    }

    @Nested
    class HasPermissionToJoinTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldReturnPermissionStatusSuccessfully() {
            when(service.hasPermissionToJoin(any(String.class), any(Authentication.class)))
                    .thenReturn(true);

            mockMvc.perform(
                            MockMvcRequestBuilders.get("/api/v1/meetings/meet-1/has/permission/to/join")
                    )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value(true));
        }
    }

    @Nested
    class WaitingUsersTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldReturnWaitingUsersSuccessfully() {
            when(service.getWaitingUsers(any(String.class), any(Authentication.class)))
                    .thenReturn(List.of(UserResponse.builder().build()));

            mockMvc.perform(
                            MockMvcRequestBuilders.get("/api/v1/meetings/meet-1/waiting/users")
                    )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }
    }

    @Nested
    class IsExistTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldReturnTrue_whenMeetingExists() {
            when(service.isExist(any(String.class))).thenReturn(true);

            mockMvc.perform(
                            MockMvcRequestBuilders.get("/api/v1/meetings/meet-1/is/exist")
                    )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value(true));
        }
    }

    @Nested
    class RemoveFromMeetingTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldRemoveUserFromMeetingSuccessfully() {
            mockMvc.perform(
                            patch("/api/v1/meetings/meet-1/remove")
                    )
                    .andExpect(status().isOk());
        }
    }
}
