package dev.aniketkadam.server.call;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaToggle {

    private String mediaType; // CAMERA, MIC
    private boolean isOn;
}
