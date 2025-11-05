package dev.aniketkadam.server.webrtc;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebRtcController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/webrtc")
    public void handleSignal(SignalPacket packet) throws OperationNotPermittedException {
        System.out.println("From: " + packet.getFrom() + " TO: " + packet.getTo());
        messagingTemplate.convertAndSend("/topic/webrtc/connection/" + packet.getTo(), packet);
    }
}
