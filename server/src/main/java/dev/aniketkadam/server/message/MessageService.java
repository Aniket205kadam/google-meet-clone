package dev.aniketkadam.server.message;

import dev.aniketkadam.server.call.Call;
import dev.aniketkadam.server.call.CallRepository;
import dev.aniketkadam.server.call.CallStatus;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.user.User;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final CallRepository repository;
    private final MessageRepository messageRepository;
    private final MessageMapper mapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageResponse sendMessage(String callId, String content, Authentication authentication) throws OperationNotPermittedException {
        User connectedUser = (User) authentication.getPrincipal();
        Call call = repository.findById(callId)
                .orElseThrow(() -> new EntityNotFoundException("Call is not found with ID: " + callId));

        boolean isCaller = call.getCaller().getEmail().equals(connectedUser.getEmail());
        boolean isReceiver = call.getReceiver().getEmail().equals(connectedUser.getEmail());

        if (!isCaller && !isReceiver) {
            throw new OperationNotPermittedException("Only caller and receiver can send messages.");
        }

        if (!call.getStatus().equals(CallStatus.ACCEPTED)) {
            throw new OperationNotPermittedException("Call is ended or not accepted yet.");
        }

        User targetUser = isCaller ? call.getReceiver() : call.getCaller();

        Message message = Message.builder()
                .content(content)
                .call(call)
                .sender(connectedUser)
                .receiver(targetUser)
                .createdAt(LocalDateTime.now())
                .build();
        Message savedMessage = messageRepository.save(message);
        MessageResponse messageResponse = mapper.toMessageResponse(savedMessage);

        messagingTemplate.convertAndSend(
                "/topic/call/" + call.getId() + "/messages/user/" + targetUser.getEmail(),
                messageResponse
        );

        return messageResponse;
    }

    public List<MessageResponse> getMessagesByCallId(String callId, Authentication authentication) throws OperationNotPermittedException {
        User connectedUser = (User) authentication.getPrincipal();
        Call call = repository.findById(callId)
                .orElseThrow(() -> new EntityNotFoundException("Call is not found with Id: " + callId));
        boolean isCaller = call.getCaller().getEmail().equals(connectedUser.getEmail());
        boolean isReceiver = call.getReceiver().getEmail().equals(connectedUser.getEmail());

        if (!isCaller && !isReceiver) {
            throw new OperationNotPermittedException("Only caller and receiver can read messages.");
        }
        return call.getMessages().stream()
                .map(mapper::toMessageResponse)
                .toList();
    }
}
