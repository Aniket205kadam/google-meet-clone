package dev.aniketkadam.server.authentication;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.exception.RefreshTokenException;
import dev.aniketkadam.server.security.JwtService;
import dev.aniketkadam.server.user.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.testcontainers.shaded.com.google.common.net.HttpHeaders;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private UserMapper mapper;
    @Mock
    private HttpServletRequest servletRequest;
    @Mock
    private HttpServletResponse servletResponse;

    @Spy
    @InjectMocks
    private AuthenticationService authenticationService;

    private GoogleIdToken googleIdToken;
    private GoogleIdToken.Payload payload;
    private User mappedUser;
    private Role role;


    @BeforeEach
    void setup() {
        payload = mock(GoogleIdToken.Payload.class);

        googleIdToken = mock(GoogleIdToken.class);

        role = Role.builder()
                .id("role-1")
                .name(RoleName.USER)
                .build();

        mappedUser = User.builder()
                .id("user-1")
                .email("user@test.com")
                .fullName("Test User")
                .isAccountCompleted(false)
                .build();
        ReflectionTestUtils.setField(
                authenticationService,
                "refreshTokenExpiration",
                604800L
        );
    }

    @Nested
    class LoginWithGoogleTests {
        @Test
        void shouldLoginWithGoogleSuccessfully() throws Exception {
            String token = "valid-google-token";

            doReturn(googleIdToken)
                    .when(authenticationService)
                    .verifyGoogleToken(token);
            when(roleRepository.findByName(RoleName.USER))
                    .thenReturn(Optional.of(role));
            when(googleIdToken.getPayload()).thenReturn(payload);
            when(mapper.fromGoogleUser(any()))
                    .thenReturn(mappedUser);
            when(userRepository.save(any(User.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            when(jwtService.generateAccessToken(anyMap(), any(User.class)))
                    .thenReturn("access-token");
            when(jwtService.generateRefreshToken(anyMap(), any(User.class)))
                    .thenReturn("refresh-token");

            AuthenticationResponse response =
                    authenticationService.loginWithGoogle(token, servletResponse);

            assertNotNull(response);
            assertEquals("user@test.com", response.getEmail());
            assertEquals("access-token", response.getAccessToken());

            verify(refreshTokenRepository).save(any(RefreshToken.class));
            verify(servletResponse)
                    .addHeader(eq(HttpHeaders.SET_COOKIE), contains("refreshToken"));
        }

        @Test
        void shouldThrowExceptionWhenGoogleTokenInvalid() throws Exception {
            String token = "invalid-token";

            doReturn(null)
                    .when(authenticationService)
                    .verifyGoogleToken(token);

            OperationNotPermittedException exception =
                    assertThrows(
                            OperationNotPermittedException.class,
                            () -> authenticationService.loginWithGoogle(token, servletResponse));

            assertEquals(
                    "Failed to retrieve your Google account information.",
                    exception.getMessage()
            );

            verifyNoInteractions(userRepository, jwtService);
        }

        @Test
        void shouldCreateRoleIfNotExists() throws Exception {
            String token = "valid-token";

            doReturn(googleIdToken)
                    .when(authenticationService)
                    .verifyGoogleToken(token);

            when(roleRepository.findByName(RoleName.USER))
                    .thenReturn(Optional.empty());
            when(roleRepository.save(any(Role.class)))
                    .thenReturn(role);

            when(mapper.fromGoogleUser(any()))
                    .thenReturn(mappedUser);
            when(userRepository.save(any(User.class)))
                    .thenReturn(mappedUser);

            when(jwtService.generateAccessToken(anyMap(), any()))
                    .thenReturn("access");
            when(jwtService.generateRefreshToken(anyMap(), any()))
                    .thenReturn("refresh");

            authenticationService.loginWithGoogle(token, servletResponse);

            verify(roleRepository).save(any(Role.class));
        }
    }

    @Nested
    class RefreshAccessTokenTests {

        @Test
        void shouldRefreshAccessTokenSuccessfully() throws Exception {
            String refreshTokenValue = "refresh-token-123";

            Cookie cookie = new Cookie("refreshToken", refreshTokenValue);
            when(servletRequest.getCookies()).thenReturn(new Cookie[]{cookie});

            User user = User.builder()
                    .id("user-1")
                    .email("user@test.com")
                    .fullName("Test User")
                    .build();

            RefreshToken refreshToken = RefreshToken.builder()
                    .token(refreshTokenValue)
                    .user(user)
                    .isExpired(false)
                    .revoked(false)
                    .build();

            when(refreshTokenRepository.findByToken(refreshTokenValue))
                    .thenReturn(Optional.of(refreshToken));

            when(jwtService.isValidToken(refreshTokenValue, user))
                    .thenReturn(true);

            when(jwtService.generateAccessToken(anyMap(), eq(user)))
                    .thenReturn("new-access-token");

            Object result = authenticationService.refreshAccessToken(servletRequest, servletResponse);

            assertNotNull(result);
            assertInstanceOf(AuthenticationResponse.class, result);

            AuthenticationResponse authResponse = (AuthenticationResponse) result;
            assertEquals("new-access-token", authResponse.getAccessToken());
            assertEquals(user.getEmail(), authResponse.getEmail());

            verify(refreshTokenRepository).findByToken(refreshTokenValue);
            verify(jwtService).generateAccessToken(anyMap(), eq(user));
            verify(refreshTokenRepository, never()).save(any());
        }

        @Test
        void shouldThrowExceptionWhenRefreshTokenIsRevoked() {
            String refreshTokenValue = "revoked-token";

            Cookie cookie = new Cookie("refreshToken", refreshTokenValue);
            when(servletRequest.getCookies()).thenReturn(new Cookie[]{cookie});

            User user = User.builder().id("user-1").build();

            RefreshToken refreshToken = RefreshToken.builder()
                    .token(refreshTokenValue)
                    .user(user)
                    .isExpired(true)
                    .revoked(true)
                    .build();

            when(refreshTokenRepository.findByToken(refreshTokenValue))
                    .thenReturn(Optional.of(refreshToken));

            assertThrows(
                    RefreshTokenException.class,
                    () -> authenticationService.refreshAccessToken(servletRequest, servletResponse)
            );

            verify(refreshTokenRepository).save(refreshToken);
        }

    }

}
