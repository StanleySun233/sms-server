package com.smsserver.controller;

import com.smsserver.dto.ApiResponse;
import com.smsserver.dto.MarkCallsReadRequest;
import com.smsserver.dto.MissedCallResponse;
import com.smsserver.dto.MissedCallSummary;
import com.smsserver.service.MissedCallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for missed call management
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MissedCallController {
    private final MissedCallService missedCallService;

    /**
     * Get missed calls grouped by phone number
     * GET /api/devices/:id/missed-calls
     */
    @GetMapping("/devices/{id}/missed-calls")
    public ApiResponse<List<MissedCallSummary>> getMissedCalls(
            @PathVariable Long id,
            Authentication auth) {
        try {
            Long userId = Long.parseLong(auth.getName());
            List<MissedCallSummary> calls = missedCallService.getMissedCallsByPhone(id, userId);
            return ApiResponse.success(calls);
        } catch (Exception e) {
            log.error("Failed to get missed calls for device {}", id, e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * Get call history for a specific phone number
     * GET /api/devices/:id/calls?phone=xxx
     */
    @GetMapping("/devices/{id}/calls")
    public ApiResponse<List<MissedCallResponse>> getCallHistory(
            @PathVariable Long id,
            @RequestParam String phone,
            Authentication auth) {
        try {
            Long userId = Long.parseLong(auth.getName());
            List<MissedCallResponse> calls = missedCallService.getCallHistory(id, phone, userId);
            return ApiResponse.success(calls);
        } catch (Exception e) {
            log.error("Failed to get call history for device {} and phone {}", id, phone, e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * Mark calls as read
     * PUT /api/calls/read
     */
    @PutMapping("/calls/read")
    public ApiResponse<Void> markCallsAsRead(
            @RequestBody MarkCallsReadRequest request,
            Authentication auth) {
        try {
            Long userId = Long.parseLong(auth.getName());
            missedCallService.markCallsAsRead(request.getCallIds(), userId);
            return ApiResponse.success(null);
        } catch (Exception e) {
            log.error("Failed to mark calls as read", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * Get unread call count for a device
     * GET /api/devices/:id/missed-calls/unread-count
     */
    @GetMapping("/devices/{id}/missed-calls/unread-count")
    public ApiResponse<Long> getUnreadCallCount(
            @PathVariable Long id,
            Authentication auth) {
        try {
            Long userId = Long.parseLong(auth.getName());
            Long count = missedCallService.getUnreadCallCount(id, userId);
            return ApiResponse.success(count);
        } catch (Exception e) {
            log.error("Failed to get unread call count for device {}", id, e);
            return ApiResponse.error(e.getMessage());
        }
    }
}
