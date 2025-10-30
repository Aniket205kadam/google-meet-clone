package dev.aniketkadam.server.authentication;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.exception.RefreshTokenException;
import dev.aniketkadam.server.file.FileUtils;
import dev.aniketkadam.server.profileImg.ProfileImg;
import dev.aniketkadam.server.profileImg.ProfileImgRepository;
import dev.aniketkadam.server.security.JwtService;
import dev.aniketkadam.server.user.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RoleRepository roleRepository;
    private final UserMapper mapper;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;
    @Value("${application.security.jwt.refresh-token-expiration}")
    private Long refreshTokenExpiration;

    @Transactional
    public AuthenticationResponse loginWithGoogle(
            @NotNull String token,
            HttpServletResponse httpResponse
    ) throws GeneralSecurityException, IOException, OperationNotPermittedException {
        GoogleIdToken idToken = verifyGoogleToken(token);
        if (idToken == null) {
            throw new OperationNotPermittedException("Failed to retrieve your Google account information.");
        }
        GoogleIdToken.Payload googleUser = idToken.getPayload();
        Role role = roleRepository.findByName(RoleName.USER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.USER).build()));
        User user = mapper.fromGoogleUser(googleUser);
        user.setRole(role);
        User savedUser = userRepository.save(user);

        // Generate security token
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", savedUser.getEmail());
        final String accessToken = jwtService.generateAccessToken(claims, savedUser);
        final  String refreshToken = jwtService.generateRefreshToken(claims, savedUser);
        refreshTokenRepository.save(RefreshToken.builder()
                .token(refreshToken)
                .user(savedUser)
                .isExpired(false)
                .revoked(false)
                .build());

        // Set cookies
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(refreshTokenExpiration)
                .sameSite("Lax")
                .build();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return AuthenticationResponse.builder()
                .userId(savedUser.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .isAccountCompleted(savedUser.isAccountCompleted())
                .profileUrl((savedUser.getProfile() == null) ? "" : savedUser.getProfile().getProfileUrl())
                .accessToken(accessToken)
                .build();
    }

    private GoogleIdToken verifyGoogleToken(String token) throws GeneralSecurityException, IOException {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                JacksonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(googleClientId))
                .build();
        return verifier.verify(token);
    }

    @Transactional
    public Object refreshAccessToken(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) throws RefreshTokenException {
        String token = Arrays.stream(Optional.ofNullable(httpRequest.getCookies()).orElse(new Cookie[0]))
                .filter(c -> "refreshToken".equals(c.getName()))
                .map(cookie -> URLDecoder.decode(cookie.getValue(), StandardCharsets.UTF_8))
                .findFirst()
                .orElseThrow(() -> new RefreshTokenException("No refresh token found in cookies"));

        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RefreshTokenException("Refresh token not found or invalid."));
        User currentUser = refreshToken.getUser();
        if (refreshToken.isRevoked() || refreshToken.isExpired() || !jwtService.isValidToken(refreshToken.getToken(), currentUser)) {
            refreshToken.setRevoked(true);
            refreshToken.setExpired(true);
            refreshTokenRepository.save(refreshToken);
            throw new RefreshTokenException("Refresh token expired or revoked.");
        }
        // Generate Access Token
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", currentUser.getEmail());
        final String newAccessToken = jwtService.generateAccessToken(claims, currentUser);

        return AuthenticationResponse.builder()
                .userId(currentUser.getId())
                .fullName(currentUser.getFullName())
                .email(currentUser.getEmail())
                .accessToken(newAccessToken)
                .build();
    }
}
