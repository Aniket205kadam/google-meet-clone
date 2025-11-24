package dev.aniketkadam.server.call;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.pagination.PageResponse;
import dev.aniketkadam.server.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public PageResponse<CallResponse> getAllCallHistory(int page, int size, Authentication authentication) {
        User connectedUser = (User) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size, Sort.by("startedAt").descending());
        Page<Call> calls = repository.findUserAllCalls(pageable, connectedUser.getId());
        List<CallResponse> callResponses = calls.stream().map(callMapper::toCallResponse).toList();
        return PageResponse.<CallResponse>builder()
                .content(callResponses)
                .number(calls.getNumber())
                .size(calls.getSize())
                .totalElements(calls.getTotalElements())
                .totalPages(calls.getTotalPages())
                .first(calls.isFirst())
                .last(calls.isLast())
                .build();
    }
}
