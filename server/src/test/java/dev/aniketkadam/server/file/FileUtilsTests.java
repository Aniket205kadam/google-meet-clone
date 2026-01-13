package dev.aniketkadam.server.file;

import com.cloudinary.Cloudinary;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("File Utils Tests")
public class FileUtilsTests {

    @Mock
    private Cloudinary cloudinary;
    @Mock
    private MultipartFile multipartFile;
    @Mock
    private com.cloudinary.Uploader uploader;

    @InjectMocks
    private FileUtils fileUtils;

    @Nested
    @DisplayName("Should Upload Profile Image Tests")
    class UploadProfileImage {

        @Test
        @DisplayName("Should upload profile image successfully")
        void shouldUploadProfileImageSuccessfully() throws IOException, OperationNotPermittedException {
            byte[] fileBytes = "dummy-image".getBytes();
            Map<String, Object> uploadResult = Map.of(
                    "url", "https://cloudinary.com/image123.jpg",
                    "public_id", "namaskar/profiles/image123"
            );

            when(cloudinary.uploader())
                    .thenReturn(uploader);
            when(multipartFile.getBytes())
                    .thenReturn(fileBytes);
            when(uploader.upload(any(byte[].class), any(Map.class)))
                    .thenReturn(uploadResult);

            Map result = fileUtils.uploadProfileImage(multipartFile);

            assertNotNull(result);
            assertEquals(uploadResult.get("url"), result.get("url"));

            verify(cloudinary, times(1)).uploader();
            verify(multipartFile, times(1)).getBytes();
            verify(uploader, times(1))
                    .upload(any(byte[].class), argThat(option ->
                        "namaskar/profiles".equals(option.get("folder")) &&
                                "image".equals(option.get("resource_type"))
                    ));
        }

        @Test
        @DisplayName("Should throw exception successfully when upload fails")
        void shouldThrowException_whenUploadFails() throws IOException {
            when(cloudinary.uploader())
                    .thenReturn(uploader);
            when(multipartFile.getBytes())
                    .thenThrow(new IOException("Failed to read the file!"));

            OperationNotPermittedException exception = assertThrows(
                    OperationNotPermittedException.class,
                    () -> fileUtils.uploadProfileImage(multipartFile)
            );

            assertNotNull(exception);
            assertEquals("Profile image upload could not be completed. Please try again.", exception.getMessage());

            verify(multipartFile, times(1)).getBytes();
            verifyNoInteractions(uploader);
        }
    }
}
