package dev.aniketkadam.server.call;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CallService {

    private final CallRepository repository;
    private final CallMapper callMapper;

    public CallResponse getCallById(String callId, Authentication authentication) throws OperationNotPermittedException {
        User connectedUser = (User) authentication.getPrincipal();
        Call call = repository.findById(callId)
                .orElseThrow(() -> new EntityNotFoundException("Call is not found with Id: " + callId));
        if (!isUserParticipantOfCall(connectedUser, call)) {
            throw new OperationNotPermittedException("Only call participant can get details of the call.");
        }
        return callMapper.toCallResponse(call);
    }

    private boolean isUserParticipantOfCall(User user, Call call) {
        return (user.getEmail().equals(call.getReceiver().getEmail()) || user.getEmail().equals(call.getCaller().getEmail()));
    }
}
