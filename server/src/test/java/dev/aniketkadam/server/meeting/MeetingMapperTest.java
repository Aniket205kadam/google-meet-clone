package dev.aniketkadam.server.meeting;

import dev.aniketkadam.server.user.User;
import dev.aniketkadam.server.user.UserMapper;
import dev.aniketkadam.server.user.UserResponse;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MeetingMapperTest {

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private MeetingMapper meetingMapper;

    @Nested
    class ToMeetingParticipantResponse {

        @Test
        void shouldMapMeetingParticipantToResponse() {
            User user = User.builder()
                    .id("user-1")
                    .fullName("Test User")
                    .email("test@test.com")
                    .build();

            UserResponse userResponse = UserResponse.builder()
                    .id("user-1")
                    .fullName("Test User")
                    .email("test@test.com")
                    .build();

            LocalDateTime joinedAt = LocalDateTime.now();
            LocalDateTime leftAt = LocalDateTime.now().plusMinutes(10);

            MeetingParticipant participant = MeetingParticipant.builder()
                    .id("participant-1")
                    .user(user)
                    .muted(true)
                    .joinedAt(joinedAt)
                    .leftAt(leftAt)
                    .build();

            when(userMapper.toUserResponse(user)).thenReturn(userResponse);

            MeetingParticipantResponse response =
                    meetingMapper.toMeetingParticipantResponse(participant);

            assertNotNull(response);
            assertEquals("participant-1", response.getId());
            assertEquals(userResponse, response.getUser());
            assertTrue(response.isMuted());
            assertEquals(joinedAt, response.getJoinedAt());
            assertEquals(leftAt, response.getLeftAt());

            verify(userMapper).toUserResponse(user);
            verifyNoMoreInteractions(userMapper);
        }
    }


}
