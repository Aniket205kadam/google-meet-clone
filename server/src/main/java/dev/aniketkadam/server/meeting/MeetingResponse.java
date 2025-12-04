package dev.aniketkadam.server.meeting;

import dev.aniketkadam.server.user.UserResponse;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingResponse {

    private String id;
    private String meetingCode;
    private LocalDateTime createdAt;
    private UserResponse createdBy;
    private List<MeetingParticipantResponse> meetingParticipants;
}
