package com.smsserver.controller;

import com.smsserver.dto.LoginRequest;
import com.smsserver.dto.RegisterRequest;
import com.smsserver.dto.UserResponse;
import com.smsserver.entity.User;
import com.smsserver.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    private static final String SESSION_COOKIE_NAME = "SESSION_ID";
    private static final int COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = authService.register(request);
            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        try {
            String sessionId = authService.login(request);

            // Set session cookie
            Cookie cookie = new Cookie(SESSION_COOKIE_NAME, sessionId);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(COOKIE_MAX_AGE);
            response.addCookie(cookie);

            return ResponseEntity.ok().body("Login successful");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@CookieValue(name = SESSION_COOKIE_NAME, required = false) String sessionId,
                                   HttpServletResponse response) {
        if (sessionId != null) {
            authService.logout(sessionId);

            // Clear cookie
            Cookie cookie = new Cookie(SESSION_COOKIE_NAME, null);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(0);
            response.addCookie(cookie);
        }

        return ResponseEntity.ok("Logout successful");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@CookieValue(name = SESSION_COOKIE_NAME, required = false) String sessionId) {
        if (sessionId == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        User user = authService.getCurrentUser(sessionId);
        if (user == null) {
            return ResponseEntity.status(401).body("Session expired");
        }

        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }
}
