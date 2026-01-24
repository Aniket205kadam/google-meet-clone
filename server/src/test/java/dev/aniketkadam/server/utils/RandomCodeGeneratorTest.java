package dev.aniketkadam.server.utils;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
public class RandomCodeGeneratorTest {

    @Nested
    class GenerateMeetingCodeTests {

        @Test
        void shouldGenerateMeetingCodeWithCorrectFormat() {
            String code = RandomCodeGenerator.generateMeetingCode();

            assertNotNull(code);
            assertEquals(12, code.length()); // 3 + 1 + 4 + 1 + 3
            assertTrue(code.matches("[a-z]{3}-[a-z]{4}-[a-z]{3}"));
        }

        @Test
        void shouldContainHyphensAtCorrectPositions() {
            String code = RandomCodeGenerator.generateMeetingCode();

            assertEquals('-', code.charAt(3));
            assertEquals('-', code.charAt(8));
        }

        @Test
        void shouldContainOnlyLowercaseLettersAndHyphens() {
            String code = RandomCodeGenerator.generateMeetingCode();

            for (char c : code.toCharArray()) {
                assertTrue(
                        (c >= 'a' && c <= 'z') || c == '-',
                        "Invalid character found: " + c
                );
            }
        }

        @Test
        void shouldGenerateDifferentCodesMostOfTheTime() {
            String code1 = RandomCodeGenerator.generateMeetingCode();
            String code2 = RandomCodeGenerator.generateMeetingCode();

            assertNotEquals(code1, code2);
        }
    }
}
