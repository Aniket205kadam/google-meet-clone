package dev.aniketkadam.server.meeting;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.user.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService service;

    @PostMapping
    public ResponseEntity<String> createMeeting(Authentication authentication) {
        return ResponseEntity.ok(service.createMeeting(authentication));
    }

    @GetMapping("/{meeting-code}/is/admin")
    public ResponseEntity<Boolean> isAdmin(
            @PathVariable("meeting-code") String meetingCode,
            Authentication authentication
    ) {
       return ResponseEntity.ok(service.isAdmin(meetingCode, authentication));
    }

    @GetMapping("/{meeting-code}/participants")
    public ResponseEntity<List<MeetingParticipantResponse>> getParticipants(
            @PathVariable("meeting-code") String meetingCode,
            Authentication authentication
    ) {
        return ResponseEntity.ok(service.getMeetingParticipants(meetingCode, authentication));
    }

    @GetMapping("/{meeting-code}/participants/all")
    public ResponseEntity<List<MeetingParticipantResponse>> getParticipantsAll(
            @PathVariable("meeting-code") String meetingCode,
            Authentication authentication
    ) {
        return ResponseEntity.ok(service.getMeetingParticipantsAll(meetingCode, authentication));
    }

    @PatchMapping("/{meeting-code}/admin/permission")
    public void getAdminPermissionToJoin(
            @PathVariable("meeting-code") String meetingCode,
            Authentication authentication
    ) {
        service.getAdminPermission(meetingCode, authentication);
    }

    @PatchMapping("/{meeting-code}/add/in/meeting")
    public void generatePermissionToUsers(
            @PathVariable("meeting-code") String meetingCode,
            Authentication authentication,
            @RequestBody List<String> userIds
    ) throws OperationNotPermittedException {
        service.generatePermissionToUsers(meetingCode, authentication, userIds);
    }

    @PatchMapping("/{meeting-code}/add")
    public void addUserInMeeting(
            @PathVariable("meeting-code") String meetingCode,
            Authentication authentication
    ) throws OperationNotPermittedException {
        service.addUserInMeeting(meetingCode, authentication);
    }

    @GetMapping("/{meeting-code}/has/permission/to/join")
    public ResponseEntity<Boolean> hasPermissionToJoin(
            @PathVariable("meeting-code") String meetingCode,
            Authentication authentication
    ) {
        return ResponseEntity.ok(service.hasPermissionToJoin(meetingCode, authentication));
    }

    @GetMapping("/{meeting-code}/waiting/users")
    public ResponseEntity<List<UserResponse>> getWaitingUsers(
            @PathVariable("meeting-code") String meetingCode,
            Authentication authentication
    ) throws OperationNotPermittedException {
        return ResponseEntity.ok(service.getWaitingUsers(meetingCode, authentication));
    }

    @GetMapping("/{meeting-code}/is/exist")
    public ResponseEntity<Boolean> isExistByMeetCode(
            @PathVariable("meeting-code") String meetingCode
    ) {
        return ResponseEntity.ok(service.isExist(meetingCode));
    }

    @PatchMapping("/{meeting-code}/remove")
    public void removeFromMeeting(
            @PathVariable("meeting-code") String meetingCode,
            Authentication authentication
    ) {
        service.removeFromMeeting(meetingCode, authentication);
    }
}
