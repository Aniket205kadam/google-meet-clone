package dev.aniketkadam.server.webrtc;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallRejectRequest {

    @NotBlank(message = "Call ID must not be blank.")
    private String callId;

    @NotBlank(message = "Caller ID must not be blank.")
    private String callerId;

    @NotBlank(message = "Receiver ID must not be blank.")
    private String receiverId;

    private Boolean isRinging;
}
