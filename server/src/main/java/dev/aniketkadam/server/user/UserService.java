package dev.aniketkadam.server.user;

import dev.aniketkadam.server.call.Call;
import dev.aniketkadam.server.call.CallRepository;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.file.FileUtils;
import dev.aniketkadam.server.profileImg.ProfileImg;
import dev.aniketkadam.server.profileImg.ProfileImgRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FileUtils fileUtils;
    private final ProfileImgRepository profileImgRepository;
    private final UserMapper mapper;
    private final CallRepository callRepository;

    @Transactional
    public Boolean completeAccount(
            @NotNull String fullName,
            LocalDate birthDate,
            MultipartFile profile,
            Authentication authentication
    ) throws OperationNotPermittedException {
        User connectedUser = (User) authentication.getPrincipal();

        if (!connectedUser.isAccountCompleted()) {
            // stored the profile image
            ProfileImg profileImg = null;
            if (profile != null && !profile.isEmpty()) {
                Map response = fileUtils.uploadProfileImage(profile);
                profileImg = profileImgRepository.save(ProfileImg.builder()
                                .profileUrl((String) response.get("secure_url"))
                                .publicId((String) response.get("public_id"))
                        .build());
            }
            connectedUser.setFullName(fullName);
            connectedUser.setBirthDate(birthDate);
            connectedUser.setProfile(profileImg);
        }
        connectedUser.setAccountCompleted(true);
        User savedUser = userRepository.save(connectedUser);
        return savedUser.isAccountCompleted();
    }

    public UserResponse fetchUserByToken(Authentication authentication) {
        User connectedUser = (User) authentication.getPrincipal();
        return mapper.toUserResponse(connectedUser);
    }

    public List<UserResponse> fetchSuggestedUsers(Integer size, Authentication authentication) {
        User connectedUser = (User) authentication.getPrincipal();
        List<User> suggestedUsers = new LinkedList<>();

        List<Call> previousCalls = callRepository.findUserByCallerIdOrReceiverId(connectedUser.getId());
        List<User> previousCalledUsers = previousCalls.stream()
                .map(c ->
                        (c.getCaller().getId().equals(connectedUser.getId()))
                                ? c.getReceiver()
                                : c.getCaller())
                .distinct()
                .toList();
        int endIdx = Math.min(size, previousCalledUsers.size());
        suggestedUsers.addAll(previousCalledUsers.subList(0, endIdx));

        return suggestedUsers.size() <= 0
                ? new ArrayList<>()
                : suggestedUsers.stream()
                .map(mapper::toUserResponse)
                .toList();
    }

    public List<UserResponse> fetchSearchUser(String keyword, Integer size, Authentication authentication) {
        User connectedUser = (User) authentication.getPrincipal();
        return userRepository.searchByFullNameOrPhoneOrEmail(keyword, size)
                .stream()
                // from search remove the connected user
                .filter(user -> !connectedUser.getId().equals(user.getId()))
                .map(mapper::toUserResponse)
                .toList();
    }

    public UserResponse fetchUserById(String userId, Authentication authentication) throws OperationNotPermittedException {
        User connectedUser = (User) authentication.getPrincipal();
        User fetchedUser = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User is not found with Id: " + userId));
        if (fetchedUser.getId().equals(connectedUser.getId())) {
            throw new OperationNotPermittedException("User not fetch there own details by Id");
        }
        return mapper.toUserResponse(fetchedUser);
    }

    public UserResponse fetchUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(mapper::toUserResponse)
                .orElseThrow(() -> new EntityNotFoundException("User not found with Email " + email));
    }
}
