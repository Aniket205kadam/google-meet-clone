package dev.aniketkadam.server.message;

import dev.aniketkadam.server.call.CallResponse;
import dev.aniketkadam.server.user.UserResponse;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {

    private String id;
    private String content;
    private UserResponse sender;
    private UserResponse receiver;
    private CallResponse call;
    private LocalDateTime createdAt;
}
