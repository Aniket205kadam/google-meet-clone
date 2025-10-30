package dev.aniketkadam.server.user;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private String id;
    private String fullName;
    private String email;
    private LocalDate birthDate;
    private String profile;
}
