package dev.aniketkadam.server.call;

import com.fasterxml.jackson.annotation.JsonInclude;
import dev.aniketkadam.server.user.UserResponse;
import dev.aniketkadam.server.webrtc.CallMode;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class CallResponse {

    private String id;
    private String callerId;
    private UserResponse caller;
    private String receiverId;
    private CallStatus status;
    private CallMode mode;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}
