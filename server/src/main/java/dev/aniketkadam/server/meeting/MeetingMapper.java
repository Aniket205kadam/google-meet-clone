package dev.aniketkadam.server.meeting;

import dev.aniketkadam.server.user.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MeetingMapper {

    private final UserMapper userMapper;

    public MeetingParticipantResponse toMeetingParticipantResponse(MeetingParticipant meetingParticipant) {
        return MeetingParticipantResponse.builder()
                .id(meetingParticipant.getId())
                .user(userMapper.toUserResponse(meetingParticipant.getUser()))
                .muted(meetingParticipant.isMuted())
                .joinedAt(meetingParticipant.getJoinedAt())
                .leftAt(meetingParticipant.getLeftAt())
                .build();
    }

    /*public MeetingResponse toMeetingResponse(Meeting meeting) {
        List<MeetingParticipantResponse> meetingParticipantResponses = new ArrayList<>();
        if (!meeting.getMeetingParticipants().isEmpty()) {
            meetingParticipantResponses = meeting.getMeetingParticipants()
                    .stream()
                    .map(this::toMeetingParticipantResponse)
                    .toList();
        }
        return MeetingResponse.builder()
                .id(meeting.getId())
                .meetingCode(meeting.getMeetingCode())
                .createdBy(userMapper.toUserResponse(meeting.getCreatedBy()))
                .createdAt(meeting.getCreatedAt())
                //.meetingParticipants(meetingParticipantResponses)
                .build();
    }*/
}
