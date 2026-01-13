package dev.aniketkadam.server.user;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserMapperTest {

    @Mock
    private UserRepository repository;

    @InjectMocks
    private UserMapper userMapper;

    @Nested
    class FromGoogleUserTests {

        @Test
        void shouldReturnExistingUserWhenGoogleIdAlreadyExists() {
            GoogleIdToken.Payload payload = mock(GoogleIdToken.Payload.class);
            when(payload.getSubject()).thenReturn("google-123");

            User existingUser = User.builder()
                    .id("user-1")
                    .googleId("google-123")
                    .email("test@test.com")
                    .build();

            when(repository.findByGoogleId("google-123"))
                    .thenReturn(Optional.of(existingUser));

            User result = userMapper.fromGoogleUser(payload);

            assertEquals(existingUser, result);
            verify(repository).findByGoogleId("google-123");
        }

        @Test
        void shouldCreateNewUserWhenGoogleIdDoesNotExist() {
            GoogleIdToken.Payload payload = mock(GoogleIdToken.Payload.class);
            when(payload.getSubject()).thenReturn("google-456");
            when(payload.getEmail()).thenReturn("new@test.com");
            when(payload.get("name")).thenReturn("New User");

            when(repository.findByGoogleId("google-456"))
                    .thenReturn(Optional.empty());

            User result = userMapper.fromGoogleUser(payload);

            assertNotNull(result);
            assertEquals("google-456", result.getGoogleId());
            assertEquals("new@test.com", result.getEmail());
            assertEquals("New User", result.getFullName());
            assertTrue(result.isEnabled());
            assertFalse(result.isAccountCompleted());

            verify(repository).findByGoogleId("google-456");
        }
    }

    @Nested
    class ToUserResponseTests {

        @Test
        void shouldCreateNewUserWhenGoogleIdDoesNotExist() {
            GoogleIdToken.Payload payload = mock(GoogleIdToken.Payload.class);
            when(payload.getSubject()).thenReturn("google-456");
            when(payload.getEmail()).thenReturn("new@test.com");
            when(payload.get("name")).thenReturn("New User");

            when(repository.findByGoogleId("google-456"))
                    .thenReturn(Optional.empty());

            User result = userMapper.fromGoogleUser(payload);

            assertNotNull(result);
            assertEquals("google-456", result.getGoogleId());
            assertEquals("new@test.com", result.getEmail());
            assertEquals("New User", result.getFullName());
            assertTrue(result.isEnabled());
            assertFalse(result.isAccountCompleted());

            verify(repository).findByGoogleId("google-456");
        }

        @Test
        void shouldFailWhenProfileIsNull() {
            User user = User.builder()
                    .id("user-1")
                    .fullName("Test User")
                    .email("test@test.com")
                    .build();

            assertThrows(
                    NullPointerException.class,
                    () -> userMapper.toUserResponse(user)
            );
        }
    }
}
