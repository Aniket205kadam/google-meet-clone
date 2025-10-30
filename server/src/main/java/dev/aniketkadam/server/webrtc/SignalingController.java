package dev.aniketkadam.server.webrtc;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/signal")
    public void handleSignal(SignalPacket packet, Principal principal) throws OperationNotPermittedException {
        String sender = principal.getName(); // authenticated user
        // check authenticated username is match with requested user
        if (!sender.equals(packet.getFrom())) {
            throw new OperationNotPermittedException("User spoofing detected, In your devices malicious code detected!");
        }
        messagingTemplate.convertAndSend("/topic/incoming/call/" + packet.getTo(), packet);
    }
}
