package com.vault.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final String OTP_KEY_PREFIX = "otp:";
    private static final int OTP_EXPIRY_MINUTES = 5;

    public String generateAndSendOtp(String email) {
        // Generate a 6-digit random code
        String code = String.format("%06d", secureRandom.nextInt(1000000));
        
        // Save OTP to Redis with 5 minutes expiry
        String key = OTP_KEY_PREFIX + email;
        redisTemplate.opsForValue().set(key, code, OTP_EXPIRY_MINUTES, TimeUnit.MINUTES);
        
        log.info("Generated OTP for {}: [Saved in Redis with 5m TTL]", email);

        // Send OTP email
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Your Sanctum Verification Code");
            message.setText("Hello,\n\nYour 6-digit OTP verification code is: " + code + "\n\nThis code will expire in 5 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nSanctum Personal Vault Team");
            mailSender.send(message);
            log.info("Successfully sent OTP email to: {}", email);
        } catch (Exception e) {
            log.warn("Failed to send OTP email to {}: {}. [SMTP Fallback triggered]", email, e.getMessage());
            log.info("[SMTP Fallback] OTP verification code for user '{}' is: {}", email, code);
        }

        return code;
    }

    public boolean verifyOtp(String email, String code) {
        if (email == null || code == null) {
            return false;
        }
        String key = OTP_KEY_PREFIX + email;
        String cachedCode = redisTemplate.opsForValue().get(key);
        
        if (cachedCode != null && cachedCode.equals(code.trim())) {
            redisTemplate.delete(key); // consume OTP code
            log.info("OTP verification succeeded for user: {}", email);
            return true;
        }
        
        log.warn("OTP verification failed for user: {}. Entered: {}, Cached: {}", email, code, cachedCode);
        return false;
    }
}
