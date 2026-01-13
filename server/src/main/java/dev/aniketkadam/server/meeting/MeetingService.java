package dev.aniketkadam.server.meeting;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.user.User;
import dev.aniketkadam.server.user.UserMapper;
import dev.aniketkadam.server.user.UserRepository;
import dev.aniketkadam.server.user.UserResponse;
import dev.aniketkadam.server.utils.RandomCodeGenerator;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository repository;
    private final MeetingMapper mapper;
    private final MeetingParticipantRepository participantRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserMapper userMapper;
    private final UserRepository userRepository;

    private User authenticationToUser(Authentication authentication) {
        return (User) authentication.getPrincipal();
    }

    @Transactional
    public String createMeeting(Authentication authentication) {
        var connectedUser = authenticationToUser(authentication);
        Meeting meeting = Meeting.builder()
                .meetingCode(RandomCodeGenerator.generateMeetingCode())
                .createdBy(connectedUser)
                .createdAt(LocalDateTime.now())
                .build();
        var savedMeeting = repository.save(meeting);
        return savedMeeting.getMeetingCode();
    }

    public Boolean isAdmin(String meetingCode, Authentication authentication) {
        var connectedUser = authenticationToUser(authentication);
        var meeting = repository.findByMeetingCode(meetingCode)
                .orElseThrow(() -> new EntityNotFoundException("Meeting is not found with code: " + meetingCode));
        return meeting.getCreatedBy().getId().equals(connectedUser.getId());
    }

    public List<MeetingParticipantResponse> getMeetingParticipants(String meetingCode, Authentication authentication) {
        var connectedUser = (User) authentication.getPrincipal();
        var meeting = repository.findByMeetingCode(meetingCode)
                .orElseThrow(() -> new EntityNotFoundException("Meeting is not found with code: " + meetingCode));
        return meeting.getMeetingParticipants()
                .stream()
                .filter(mp -> !mp.getUser().getId().equals(connectedUser.getId()))
                .map(mapper::toMeetingParticipantResponse)
                .toList();
    }

    public void addUserInMeeting(String meetingCode, Authentication authentication) throws OperationNotPermittedException {
        var connectedUser = (User) authentication.getPrincipal();
        var meeting = repository.findByMeetingCode(meetingCode)
                .orElseThrow(() -> new EntityNotFoundException("Meeting is not found with ID: " + meetingCode));

        // you don't have permission to add
        if (!meeting.getCreatedBy().getId().equals(connectedUser.getId()) && !meeting.getAllowedUsers().stream().anyMatch(au -> au.getId().equals(connectedUser.getId()))) {
            throw new OperationNotPermittedException("You don't have permission to join the meeting");
        }

        var currentMeetingParticipants = meeting.getMeetingParticipants();
        boolean alreadyPresent = currentMeetingParticipants.stream()
                .anyMatch(mp -> mp.getUser().getId().equals(connectedUser.getId()));

        if (alreadyPresent) {
            throw new OperationNotPermittedException("You are already present in the participants list.");
        }
        var savedParticipant = participantRepository.save(
                MeetingParticipant.builder()
                        .user(connectedUser)
                        .muted(false)
                        .meeting(meeting)
                        .joinedAt(LocalDateTime.now())
                        .build()
        );

        var participantResponse = mapper.toMeetingParticipantResponse(savedParticipant);

        messagingTemplate.convertAndSend(
                "/topic/meeting/" + meetingCode + "/participant/add",
                participantResponse
        );
    }

    public void getAdminPermission(String meetingCode, Authentication authentication) {
        var connectedUser = (User) authentication.getPrincipal();
        var meeting = repository.findByMeetingCode(meetingCode)
                .orElseThrow(() -> new EntityNotFoundException("Meeting is not found with ID: " + meetingCode));

        var waitingUsers = meeting.getWaitingUsers();
        waitingUsers.add(connectedUser);
        meeting.setWaitingUsers(waitingUsers);
        repository.save(meeting);

        var admin = meeting.getCreatedBy();

        messagingTemplate.convertAndSend(
                "/topic/waiting/users/" + meetingCode + "/" + admin.getEmail(),
                userMapper.toUserResponse(connectedUser)
        );
    }

    public void generatePermissionToUsers(
            String meetingCode,
            Authentication authentication,
            List<String> userIds
    ) throws OperationNotPermittedException {
        var connectedUser = (User) authentication.getPrincipal();
        var meeting = repository.findByMeetingCode(meetingCode)
                .orElseThrow(() -> new EntityNotFoundException("Meeting is not found with ID: " + meetingCode));

        if (!meeting.getCreatedBy().getId().equals(connectedUser.getId())) {
            throw new OperationNotPermittedException("Only admin of the meeting can generate permission");
        }
        var allowedUsers = meeting.getAllowedUsers();
        var waitingUser = meeting.getWaitingUsers();
        userIds.stream().forEach((userId) -> {
            var user = userRepository.findById(userId);
            if (user.isPresent()) {
                allowedUsers.add(user.get());
            }
        });
        var newWaitingUsers = waitingUser.stream()
                .filter(wu -> !userIds.contains(wu.getId()))
                .collect(Collectors.toSet());

        meeting.setAllowedUsers(allowedUsers);
        meeting.setWaitingUsers(newWaitingUsers);
        repository.save(meeting);

        userIds.stream()
                .forEach((userId) ->
                        messagingTemplate.convertAndSend(
                                "/topic/allowed/in/meeting/" + meetingCode + "/" + userId,
                                userId
                        ));
    }

    public Boolean hasPermissionToJoin(String meetingCode, Authentication authentication) {
        var connectedUser = (User) authentication.getPrincipal();
        var meeting = repository.findByMeetingCode(meetingCode)
                .orElseThrow(() -> new EntityNotFoundException("Meeting is not found with ID: " + meetingCode));

        return connectedUser.getId().equals(meeting.getCreatedBy().getId())
                ||
                meeting.getAllowedUsers().stream().anyMatch(au -> au.getId().equals(connectedUser.getId()));
    }

    public List<UserResponse> getWaitingUsers(String meetingCode, Authentication authentication) throws OperationNotPermittedException {
        var connectedUser = (User) authentication.getPrincipal();
        var meeting = repository.findByMeetingCode(meetingCode)
                .orElseThrow(() -> new EntityNotFoundException("Meeting is not found with ID: " + meetingCode));

        if (!meeting.getCreatedBy().getId().equals(connectedUser.getId())) {
            throw new OperationNotPermittedException("Only admin of the meeting can see waiting users.");
        }

        return meeting.getWaitingUsers()
                .stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    public List<MeetingParticipantResponse> getMeetingParticipantsAll(String meetingCode, Authentication authentication) {
        var connectedUser = (User) authentication.getPrincipal();
        var meeting = repository.findByMeetingCode(meetingCode)
                .orElseThrow(() -> new EntityNotFoundException("Meeting is not found with code: " + meetingCode));
        return meeting.getMeetingParticipants()
                .stream()
                .sorted((user1, user2) -> {
                    if (user1.getUser().getId().equals(connectedUser.getId())) return -1;
                    if (user2.getUser().getId().equals(connectedUser.getId())) return 1;
                    return 0;
                })
                .map(mp -> MeetingParticipantResponse.builder()
                        .id(mp.getId())
                        .muted(mp.isMuted())
                        .user(userMapper.toUserResponse(mp.getUser()))
                        .leftAt(mp.getLeftAt())
                        .joinedAt(mp.getJoinedAt())
                        .isAdmin(meeting.getCreatedBy().getId().equals(mp.getUser().getId()))
                        .build()
                )
                .toList();
    }

    public Boolean isExist(String meetingCode) {
        return repository.existsByMeetingCode(meetingCode);
    }

    @Transactional
    public void removeFromMeeting(String meetingCode, Authentication authentication) {
        var connectedUser = (User) authentication.getPrincipal();
        var meeting = repository.findByMeetingCode(meetingCode)
                .orElseThrow(() -> new EntityNotFoundException("Meeting is not found with code"));

        var participants = meeting.getMeetingParticipants();
        var currentParticipant = participants.stream()
                .filter(p -> p.getUser().getId().equals(connectedUser.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("User is not a participant of this meeting"));

        // remove participant
        meeting.getMeetingParticipants().remove(currentParticipant);

        // TODO: update user status

        repository.save(meeting);

        // notify others
        messagingTemplate.convertAndSend(
                "/topic/meeting/" + meetingCode + "/participant/remove",
                mapper.toMeetingParticipantResponse(currentParticipant)
        );
    }

}
