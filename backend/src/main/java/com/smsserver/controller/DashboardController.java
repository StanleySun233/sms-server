package com.smsserver.controller;

import com.smsserver.dto.dashboard.DashboardStatsResponse;
import com.smsserver.entity.User;
import com.smsserver.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        User user = getCurrentUser();
        DashboardStatsResponse stats = dashboardService.getDashboardStats(user.getId());
        return ResponseEntity.ok(stats);
    }
}
