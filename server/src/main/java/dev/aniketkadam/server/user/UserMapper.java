package dev.aniketkadam.server.user;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserMapper {

    private final UserRepository repository;

    public User fromGoogleUser(GoogleIdToken.Payload googleUser) {
        String sub = googleUser.getSubject();
        Optional<User> existingUser = repository.findByGoogleId(sub);
        if (existingUser.isPresent()) {
            return existingUser.get();
        }
        return User.builder()
                .googleId(sub)
                .email(googleUser.getEmail())
                .fullName((String) googleUser.get("name"))
                .enabled(true)
                .isAccountCompleted(false)
                .build();
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .birthDate(user.getBirthDate())
                .profile(user.getProfile() != null ? user.getProfile().getProfileUrl() : "")
                .build();
    }
}
