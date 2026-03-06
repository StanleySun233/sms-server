package com.smsserver.controller;

import com.smsserver.dto.DashboardStatsResponse;
import com.smsserver.entity.User;
import com.smsserver.service.AuthService;
import com.smsserver.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;
    private final AuthService authService;

    private static final String SESSION_COOKIE_NAME = "SESSION_ID";

    /**
     * Get current user from session
     */
    private User getCurrentUser(String sessionId) {
        if (sessionId == null) {
            throw new RuntimeException("Not authenticated");
        }
        User user = authService.getCurrentUser(sessionId);
        if (user == null) {
            throw new RuntimeException("Session expired");
        }
        return user;
    }

    /**
     * Get comprehensive dashboard statistics
     * GET /api/dashboard/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats(
            @CookieValue(name = SESSION_COOKIE_NAME, required = false) String sessionId) {
        try {
            User user = getCurrentUser(sessionId);
            DashboardStatsResponse stats = dashboardService.getDashboardStats(user.getId());
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Not authenticated") || e.getMessage().equals("Session expired")) {
                return ResponseEntity.status(401).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
