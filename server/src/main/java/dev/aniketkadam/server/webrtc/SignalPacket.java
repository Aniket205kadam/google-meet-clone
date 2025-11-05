package dev.aniketkadam.server.webrtc;

import jakarta.persistence.OneToOne;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalPacket {

    private String from;
    private String to;
    private String callId;
    private String type; // "offer", "answer", "candidate"
    private String sdp; // for offer/answer
    private CandidatePacket candidate;
}
