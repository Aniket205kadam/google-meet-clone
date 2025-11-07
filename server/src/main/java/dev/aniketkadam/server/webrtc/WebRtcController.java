package dev.aniketkadam.server.webrtc;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebRtcController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/webrtc")
    public void handleSignal(SignalPacket packet) {
        System.out.println("To: " + packet.getTo() + ", Type: " + packet.getType());
        messagingTemplate.convertAndSend("/topic/webrtc/connection/" + packet.getTo(), packet);
    }
}
