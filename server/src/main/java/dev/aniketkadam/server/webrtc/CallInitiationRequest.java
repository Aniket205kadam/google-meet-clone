package dev.aniketkadam.server.webrtc;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallInitiationRequest {

    @NotNull(message = "Caller email must not be null.")
    @NotEmpty(message = "Caller email must not be empty.")
    @Email(message = "Invalid caller email format.")
    private String from;

    @NotNull(message = "Receiver email must not be null.")
    @NotEmpty(message = "Receiver email must not be empty.")
    @Email(message = "Invalid receiver email format.")
    private String to;

    @NotNull(message = "Call mode is required.")
    private CallMode mode;
}
