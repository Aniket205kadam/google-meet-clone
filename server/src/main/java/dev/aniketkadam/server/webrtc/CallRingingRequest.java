package dev.aniketkadam.server.webrtc;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallRingingRequest {

    @NotNull(message = "Call ID must not be null.")
    @NotEmpty(message = "Call ID must not be empty.")
    private String callId;

    @NotNull(message = "Caller Id must not be null.")
    @NotEmpty(message = "Caller Id must not be empty.")
    private String callerId;

    @NotNull(message = "Receiver Id must not be null.")
    @NotEmpty(message = "Receiver Id must not be empty.")
    private String receiverId;
    private CallMode mode;
    private Boolean isRinging;
}

