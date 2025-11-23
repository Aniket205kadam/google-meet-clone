package dev.aniketkadam.server.call;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionResponse {

    private String emoji;
    private String name;
}
