package dev.aniketkadam.server.user;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService service;

    @PostMapping("/account/complete")
    public ResponseEntity<Boolean> completeAccount(
            @RequestParam("fullName") String fullName,
            @RequestParam(value = "birthDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate birthDate,
            @RequestParam(value = "profile", required = false) MultipartFile profile,
            Authentication authentication
    ) throws OperationNotPermittedException {
        return ResponseEntity.ok(service.completeAccount(fullName, birthDate, profile, authentication));
    }

    @GetMapping("/fetch-user")
    public ResponseEntity<UserResponse> fetchUserById(
            Authentication authentication
    ) {
        return ResponseEntity.ok(service.fetchUserByToken(authentication));
    }

    @GetMapping("/suggested-users")
    public ResponseEntity<List<UserResponse>> getSuggestedUsers(
            @RequestParam(value = "size", required = false, defaultValue = "9") Integer size,
            Authentication authentication
    ) {
        return ResponseEntity.ok(service.fetchSuggestedUsers(size, authentication));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> getSearchUsers(
            @RequestParam("keyword") String keyword,
            @RequestParam(value = "size", required = false, defaultValue = "5") Integer size,
            Authentication authentication
    ) {
        return ResponseEntity.ok(service.fetchSearchUser(keyword, size, authentication));
    }

    @GetMapping("/u/{user-id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable("user-id") String userId,
            Authentication authentication
    ) throws OperationNotPermittedException {
        return ResponseEntity.ok(service.fetchUserById(userId, authentication));
    }
}
