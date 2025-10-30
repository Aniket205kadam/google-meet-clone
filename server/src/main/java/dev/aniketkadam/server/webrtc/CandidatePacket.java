package dev.aniketkadam.server.webrtc;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatePacket {

    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;
}
