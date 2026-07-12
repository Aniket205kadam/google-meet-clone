package dev.aniketkadam.server.authentication;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.exception.RefreshTokenException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.GeneralSecurityException;

@RestController
@RequestMapping("/api/v1/authentication")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> loginWithGoogle(
            @RequestParam("google-id") String googleId,
            HttpServletResponse httpResponse
    ) throws GeneralSecurityException, IOException, OperationNotPermittedException {
        return ResponseEntity.ok(service.loginWithGoogle(googleId, httpResponse));
    }

    @GetMapping("/refresh")
    public ResponseEntity<?> refreshAccessToken(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) throws RefreshTokenException {
        return ResponseEntity.ok(service.refreshAccessToken(httpRequest, httpResponse));
    }

    // For render
    @GetMapping("/start-server")
    public ResponseEntity<Void> startServer() {
        return ResponseEntity.ok().build();
    }
}
