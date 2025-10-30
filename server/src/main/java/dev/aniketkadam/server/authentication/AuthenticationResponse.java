package dev.aniketkadam.server.authentication;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthenticationResponse {

    private String userId;
    private String fullName;
    private String email;
    private boolean isAccountCompleted;
    private String accessToken;
    private String profileUrl;
}
