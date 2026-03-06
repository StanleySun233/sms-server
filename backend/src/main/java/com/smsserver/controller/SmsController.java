package com.smsserver.controller;

import com.smsserver.dto.*;
import com.smsserver.entity.PendingSms;
import com.smsserver.entity.SmsMessage;
import com.smsserver.entity.User;
import com.smsserver.service.SmsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("")
@RequiredArgsConstructor
@Slf4j
public class SmsController {
    private final SmsService smsService;

    private Long getCurrentUserId() {
        return ((User) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getId();
    }

    @GetMapping("/devices/{id}/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(
            @PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            List<ConversationResponse> conversations = smsService.getConversations(id, userId);
            return ResponseEntity.ok(ApiResponse.success(conversations));
        } catch (Exception e) {
            log.error("Failed to get conversations", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get messages for a specific conversation
     * GET /api/devices/:id/messages?phone=xxx&page=1&size=50
     */
    @GetMapping("/devices/{id}/messages")
    public ResponseEntity<ApiResponse<PagedMessagesResponse>> getConversationMessages(
            @PathVariable Long id,
            @RequestParam String phone,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            Long userId = getCurrentUserId();
            var messages = smsService.getConversationMessages(id, phone, userId, page, size);
            return ResponseEntity.ok(ApiResponse.success(PagedMessagesResponse.from(messages)));
        } catch (Exception e) {
            log.error("Failed to get messages", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Send an SMS message
     * POST /api/devices/:id/messages
     * Body: {"phone": "xxx", "content": "xxx"}
     */
    @PostMapping("/devices/{id}/messages")
    public ResponseEntity<ApiResponse<PendingSms>> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request) {
        try {
            Long userId = getCurrentUserId();
            PendingSms pendingSms = smsService.sendMessage(id, request.getPhone(), request.getContent(), userId);
            return ResponseEntity.ok(ApiResponse.success(pendingSms));
        } catch (Exception e) {
            log.error("Failed to send message", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Mark messages as read
     * PUT /api/messages/read
     * Body: {"messageIds": [1, 2, 3]}
     */
    @PutMapping("/messages/read")
    public ResponseEntity<ApiResponse<Void>> markMessagesAsRead(
            @Valid @RequestBody MarkReadRequest request) {
        try {
            Long userId = getCurrentUserId();
            smsService.markMessagesAsRead(request.getMessageIds(), userId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Failed to mark messages as read", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Search messages
     * GET /api/devices/:id/messages/search?keyword=xxx&phone=xxx&start_time=xxx&end_time=xxx
     */
    @GetMapping("/devices/{id}/messages/search")
    public ResponseEntity<ApiResponse<List<SmsMessage>>> searchMessages(
            @PathVariable Long id,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String start_time,
            @RequestParam(required = false) String end_time) {
        try {
            Long userId = getCurrentUserId();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            LocalDateTime startTime = start_time != null ? LocalDateTime.parse(start_time, formatter) : null;
            LocalDateTime endTime = end_time != null ? LocalDateTime.parse(end_time, formatter) : null;

            List<SmsMessage> messages = smsService.searchMessages(id, keyword, phone, startTime, endTime, userId);
            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (Exception e) {
            log.error("Failed to search messages", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Export messages to CSV
     * GET /api/devices/:id/messages/export?phone=xxx&format=csv
     */
    @GetMapping("/devices/{id}/messages/export")
    public ResponseEntity<byte[]> exportMessages(
            @PathVariable Long id,
            @RequestParam(required = false) String phone,
            @RequestParam(defaultValue = "csv") String format) {
        try {
            Long userId = getCurrentUserId();
            byte[] data = smsService.exportMessages(id, phone, format, userId);

            String filename = "messages_" + id + "_" + System.currentTimeMillis() + ".csv";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(data);
        } catch (Exception e) {
            log.error("Failed to export messages", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
