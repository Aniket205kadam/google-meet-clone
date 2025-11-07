package dev.aniketkadam.server.webrtc;

import dev.aniketkadam.server.call.Call;
import dev.aniketkadam.server.call.CallRepository;
import dev.aniketkadam.server.call.CallResponse;
import dev.aniketkadam.server.call.CallStatus;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.user.User;
import dev.aniketkadam.server.user.UserMapper;
import dev.aniketkadam.server.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SignalingService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final CallRepository callRepository;
    private final UserMapper userMapper;

    @Transactional
    public CallResponse initiateCall(CallInitiationRequest request, Authentication authentication) throws OperationNotPermittedException {
        User connectedUser = (User) authentication.getPrincipal();
        // check only connected user send the call request
        if (!connectedUser.getEmail().equals(request.getFrom())) {
            throw new OperationNotPermittedException("You are not authorized to perform this action on behalf of another user.");
        }
        User receiver = userRepository.findByEmail(request.getTo())
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + request.getTo()));
        if (receiver.isUserInCall()) {
            throw new OperationNotPermittedException("User is currently busy on another call.");
        }
        // create call
        Call call = Call.builder()
                .caller(connectedUser)
                .receiver(receiver)
                .status(CallStatus.RINGING)
                .mode(request.getMode())
                .startedAt(LocalDateTime.now())
                .build();
        Call savedCall = callRepository.save(call);
        // send notification to receiver using websocket
        messagingTemplate.convertAndSend("/topic/incoming/call/" + receiver.getEmail(), CallResponse.builder()
                        .id(savedCall.getId())
                        .callerId(savedCall.getCaller().getId())
                        .receiverId(savedCall.getReceiver().getId())
                        .caller(userMapper.toUserResponse(savedCall.getCaller()))
                        .status(CallStatus.RINGING)
                        .mode(savedCall.getMode())
                        .startedAt(savedCall.getStartedAt())
                .build());
        // caller make busy
        connectedUser.setUserInCall(true);
        userRepository.save(connectedUser);
        return CallResponse.builder()
                .id(savedCall.getId())
                .callerId(savedCall.getCaller().getId())
                .receiverId(savedCall.getReceiver().getId())
                .status(savedCall.getStatus())
                .mode(savedCall.getMode())
                .startedAt(savedCall.getStartedAt())
                .endedAt(savedCall.getEndedAt())
                .build();
    }

    @Transactional
    public void callRinging(CallRingingRequest request, Authentication authentication) throws OperationNotPermittedException {
        User connectedUser = (User) authentication.getPrincipal();
        Call call = callRepository.findById(request.getCallId())
                .orElseThrow(() -> new EntityNotFoundException("Call is not found with Id: " + request.getCallId()));
        // only call receiver can send ringing signal
        if (!connectedUser.getId().equals(call.getReceiver().getId())) {
            throw new OperationNotPermittedException("Only the receiver can send a ringing signal.");
        }
        User caller = userRepository.findById(request.getCallerId())
                .orElseThrow(() -> new EntityNotFoundException("Caller is not found with caller Id: " + request.getCallerId()));
        connectedUser.setUserInCall(true);
        userRepository.save(connectedUser);
        // send ringing notification to caller using websocket
        request.setMode(call.getMode());
        messagingTemplate.convertAndSend("/topic/call/ringing/" + caller.getEmail(), request);
    }

    @Transactional
    public void callReject(String callId, Authentication authentication) throws OperationNotPermittedException {
        User connectedUser = (User) authentication.getPrincipal();

        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new EntityNotFoundException("Call is not found with Id: " + callId));
        if (!call.getReceiver().getId().equals(connectedUser.getId())) {
            throw new OperationNotPermittedException("Only receiver can reject the call.");
        }

        User caller = call.getCaller();
        caller.setUserInCall(false);
        connectedUser.setUserInCall(false);

        userRepository.save(caller);
        userRepository.save(connectedUser);

        messagingTemplate.convertAndSend(
                "/topic/call/reject/" + call.getId() + "/" + call.getCaller().getEmail(),
                "Call has been rejected by the " + connectedUser.getFullName() + "."
        );
    }

    @Transactional
    public void callEnd(String callId, Authentication authentication) throws OperationNotPermittedException {
        User connectedUser = (User) authentication.getPrincipal();
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new EntityNotFoundException("Call is not found with Id: " + callId));
        // only caller can end the call
        if (!connectedUser.getId().equals(call.getCaller().getId())) {
            throw new OperationNotPermittedException("Only caller can end the call.");
        }
        if (call.getStatus().equals(CallStatus.ENDED)) {
            throw new OperationNotPermittedException("This call has already ended.");
        }
        call.setStatus(CallStatus.ENDED);
        Call savedCall = callRepository.save(call);

        User caller = call.getCaller();
        User receiver = call.getReceiver();

        caller.setUserInCall(false);
        receiver.setUserInCall(false);
        userRepository.save(caller);
        userRepository.save(receiver);

        messagingTemplate.convertAndSend(
                "/topic/call/end/" + call.getReceiver().getEmail(),
                CallResponse.builder()
                        .id(savedCall.getId())
                        .callerId(savedCall.getCaller().getId())
                        .receiverId(savedCall.getReceiver().getId())
                        .status(savedCall.getStatus())
                        .mode(savedCall.getMode())
                        .build()
        );
    }

    @Transactional
    public void callAccept(String callId, Authentication authentication) {
        User connectedUser = (User) authentication.getPrincipal();
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new EntityNotFoundException("Call is not found with Id: " + callId));
        if (!connectedUser.getEmail().equals(call.getReceiver().getEmail())) {
            throw new EntityNotFoundException("Only call receiver can accept the call.");
        }
        call.setStatus(CallStatus.ACCEPTED);
        callRepository.save(call);

        messagingTemplate.convertAndSend(
                "/topic/call/accept/" + call.getId() + "/" + call.getCaller().getEmail(),
                "Call has been accepted by the " + connectedUser.getFullName() + "."
        );
    }

    public void receiverReady(String callId, Authentication authentication) throws OperationNotPermittedException {
        User connectedUser = (User) authentication.getPrincipal();
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new EntityNotFoundException("Call is not found with Id: " + callId));
        if (!call.getReceiver().getEmail().equals(connectedUser.getEmail())) {
            throw new OperationNotPermittedException("Only receiver can send ready state.");
        }
        messagingTemplate.convertAndSend(
                "/topic/call/" + call.getId() + "/ready/" + call.getCaller().getEmail(),
                "Receiver is ready for call"
        );
    }
}
