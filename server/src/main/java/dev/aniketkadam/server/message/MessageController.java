package dev.aniketkadam.server.message;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService service;

    @PostMapping("/send/message/call/{call-id}")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable("call-id") String callId,
            @RequestBody MessageRequest request,
            Authentication authentication
    ) throws OperationNotPermittedException {
        return ResponseEntity.ok(service.sendMessage(callId, request.getContent(), authentication));
    }

    @GetMapping("/call/{call-id}")
    public ResponseEntity<List<MessageResponse>> getMessagesByCall(
            @PathVariable("call-id") String callId,
            Authentication authentication
    ) throws OperationNotPermittedException {
        return ResponseEntity.ok(service.getMessagesByCallId(callId, authentication));
    }
}
