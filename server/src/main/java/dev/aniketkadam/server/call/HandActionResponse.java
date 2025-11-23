package dev.aniketkadam.server.call;

import dev.aniketkadam.server.user.UserResponse;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HandActionResponse {

    private HandAction action;
    private UserResponse sender;
}
