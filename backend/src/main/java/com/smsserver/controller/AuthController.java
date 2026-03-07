package com.smsserver.controller;

import com.smsserver.dto.auth.ChangePasswordRequest;
import com.smsserver.dto.auth.LoginRequest;
import com.smsserver.dto.auth.RegisterRequest;
import com.smsserver.dto.auth.UpdatePreferencesRequest;
import com.smsserver.dto.auth.UpdateProfileRequest;
import com.smsserver.dto.auth.UserResponse;
import com.smsserver.entity.User;
import com.smsserver.service.AuthService;
import com.smsserver.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private static final List<String> ALLOWED_LOCALES = Arrays.asList("zh", "en");

    private final AuthService authService;
    private final UserPreferenceService userPreferenceService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = authService.register(request);
            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            String token = authService.login(request);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok("Logout successful");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal == null || !(principal instanceof User)) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        User user = (User) principal;
        UserResponse response = UserResponse.fromEntity(user);
        response.setPreferences(userPreferenceService.getPreferencesMap(user.getId()));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal == null || !(principal instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        try {
            User user = authService.updateProfile(((User) principal).getId(), request.getEmail());
            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/me/preferences")
    public ResponseEntity<?> updatePreferences(@Valid @RequestBody UpdatePreferencesRequest request) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal == null || !(principal instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        String locale = request.getLocale();
        if (!ALLOWED_LOCALES.contains(locale)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Locale not allowed"));
        }
        User user = (User) principal;
        userPreferenceService.setPreference(user.getId(), UserPreferenceService.KEY_LOCALE, locale);
        return ResponseEntity.ok(userPreferenceService.getPreferencesMap(user.getId()));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal == null || !(principal instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        try {
            authService.changePassword(((User) principal).getId(), request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password updated"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
