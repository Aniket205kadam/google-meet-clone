package dev.aniketkadam.server.utils;

import java.security.SecureRandom;

public class RandomCodeGenerator {
    private static final SecureRandom random = new SecureRandom();
    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyz";

    private static String randomLetters(int length) {
        StringBuilder randomStr = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            randomStr.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return randomStr.toString();
    }

    public static String generateMeetingCode() {
        return randomLetters(3) + "-" + randomLetters(4) + "-" + randomLetters(3);
    }
}
