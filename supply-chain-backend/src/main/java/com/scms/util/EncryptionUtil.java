package com.scms.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

@Component
public class EncryptionUtil {

    private final SecretKeySpec secretKeySpec;

    public EncryptionUtil(@Value("${scms.aws.s3.encryption-secret}") String secret) {
        try {
            byte[] key = secret.getBytes(StandardCharsets.UTF_8);
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            key = sha.digest(key);
            key = Arrays.copyOf(key, 32); // AES-256 requires 32 bytes
            this.secretKeySpec = new SecretKeySpec(key, "AES");
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize EncryptionUtil key spec", e);
        }
    }

    // Encrypt raw PAN value
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) return null;
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error occurred during encryption", e);
        }
    }

    // Decrypt PAN value
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isBlank()) return null;
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error occurred during decryption", e);
        }
    }

    // Hash document helper
    public static String computeSHA256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate SHA-256 checksum", e);
        }
    }

    // Mask sensitive PAN helper
    public static String maskPan(String rawPan) {
        if (rawPan == null || rawPan.length() < 6) return rawPan;
        // e.g. ABCDE1234F -> ABCDE****F
        return rawPan.substring(0, 5) + "****" + rawPan.substring(rawPan.length() - 1);
    }
}
