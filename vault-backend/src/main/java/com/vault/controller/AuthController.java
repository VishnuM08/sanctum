package com.vault.controller;

import com.vault.dto.AuthDto;
import com.vault.entity.User;
import com.vault.security.UserPrincipal;
import com.vault.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Value("${security.allow-mock-login:false}")
    private boolean allowMockLogin;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthDto.RegisterRequest request) {
        try {
            User user = userService.register(request);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthDto.LoginRequest request) {
        try {
            AuthDto.LoginResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return userService.findById(principal.id())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            String email;
            String name;

            if (request.getIdToken().startsWith("mock_")) {
                if (!allowMockLogin) {
                    throw new RuntimeException("Mock login is disabled in this environment");
                }
                // Mock login for local testing/development
                email = "google-dev@example.com";
                name = "Google Dev User";
            } else {
                // Real validation via Google APIs
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getIdToken();
                GoogleTokenInfo tokenInfo = restTemplate.getForObject(url, GoogleTokenInfo.class);
                if (tokenInfo == null || tokenInfo.getEmail() == null) {
                    throw new RuntimeException("Invalid token payload");
                }
                email = tokenInfo.getEmail();
                name = tokenInfo.getName() != null ? tokenInfo.getName() : email.split("@")[0];
            }

            com.vault.dto.AuthDto.LoginResponse response = userService.loginOrRegisterGoogle(email, name);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Google authentication failed: " + e.getMessage());
        }
    }

    public static class GoogleLoginRequest {
        private String idToken;

        public String getIdToken() {
            return idToken;
        }

        public void setIdToken(String idToken) {
            this.idToken = idToken;
        }
    }

    public static class GoogleTokenInfo {
        private String email;
        private String name;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}
