package dev.aniketkadam.server.file;

import com.cloudinary.Cloudinary;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileUtils {

    private final Cloudinary cloudinary;

    public Map uploadProfileImage(MultipartFile file) throws OperationNotPermittedException {
        try {
            return cloudinary.uploader()
                    .upload(
                            file.getBytes(),
                            Map.of("folder", "namaskar/profiles", "resource_type", "image")
                    );
        } catch (IOException e) {
            throw new OperationNotPermittedException("Profile image upload could not be completed. Please try again.");
        }
    }
}
