package dev.aniketkadam.server.meeting;

import com.fasterxml.jackson.annotation.JsonInclude;
import dev.aniketkadam.server.user.UserResponse;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MeetingParticipantResponse {

    private String id;
    private UserResponse user;
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
    private boolean isAdmin;
    private boolean muted;
}
