package com.smsserver.controller;

import com.smsserver.dto.common.ApiResponse;
import com.smsserver.dto.sms.ConversationResponse;
import com.smsserver.dto.sms.LineSummaryResponse;
import com.smsserver.dto.sms.MarkReadRequest;
import com.smsserver.dto.sms.PagedMessagesResponse;
import com.smsserver.dto.sms.RetryMessageRequest;
import com.smsserver.dto.sms.SendMessageRequest;
import com.smsserver.entity.PendingSms;
import com.smsserver.entity.SmsMessage;
import com.smsserver.entity.User;
import com.smsserver.service.SmsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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

    @GetMapping("/devices/{id}/messages/lines")
    public ResponseEntity<ApiResponse<List<LineSummaryResponse>>> getMessageLines(
            @PathVariable Long id,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        try {
            Long userId = getCurrentUserId();
            List<LineSummaryResponse> lines = smsService.getLineSummaries(id, userId, page, size);
            return ResponseEntity.ok(ApiResponse.success(lines));
        } catch (Exception e) {
            log.error("Failed to get message lines", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/devices/{id}/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(
            @PathVariable Long id,
            @RequestParam(required = false) String receiverPhone) {
        try {
            Long userId = getCurrentUserId();
            List<ConversationResponse> conversations = smsService.getConversations(id, receiverPhone, userId);
            return ResponseEntity.ok(ApiResponse.success(conversations));
        } catch (Exception e) {
            log.error("Failed to get conversations", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/devices/{id}/messages")
    public ResponseEntity<ApiResponse<PagedMessagesResponse>> getConversationMessages(
            @PathVariable Long id,
            @RequestParam String phone,
            @RequestParam(required = false) String receiverPhone,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            Long userId = getCurrentUserId();
            var messages = smsService.getConversationMessages(id, receiverPhone, phone, userId, page, size);
            return ResponseEntity.ok(ApiResponse.success(PagedMessagesResponse.from(messages)));
        } catch (Exception e) {
            log.error("Failed to get messages", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/devices/{id}/send-logs")
    public ResponseEntity<ApiResponse<List<PendingSms>>> getSendLogs(
            @PathVariable Long id,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String keyword) {
        try {
            Long userId = getCurrentUserId();
            List<PendingSms> logs = smsService.getSendLogs(id, userId, page, size, keyword);
            return ResponseEntity.ok(ApiResponse.success(logs));
        } catch (Exception e) {
            log.error("Failed to get send logs", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/devices/{id}/messages")
    public ResponseEntity<ApiResponse<SmsMessage>> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request) {
        try {
            Long userId = getCurrentUserId();
            SmsMessage message = smsService.sendMessage(id, request.getPhone(), request.getContent(), userId);
            return ResponseEntity.ok(ApiResponse.success(message));
        } catch (Exception e) {
            log.error("Failed to send message", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/devices/{id}/messages/retry")
    public ResponseEntity<ApiResponse<SmsMessage>> retryMessage(
            @PathVariable Long id,
            @RequestBody RetryMessageRequest request) {
        try {
            Long userId = getCurrentUserId();
            SmsMessage message = smsService.retryMessage(id, request.getMessageId(), userId);
            return ResponseEntity.ok(ApiResponse.success(message));
        } catch (Exception e) {
            log.error("Failed to retry message", e);
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
            @RequestParam(required = false) String receiverPhone,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String start_time,
            @RequestParam(required = false) String end_time) {
        try {
            Long userId = getCurrentUserId();
            LocalDateTime startTime = start_time != null ? parseUtcLocalDateTime(start_time) : null;
            LocalDateTime endTime = end_time != null ? parseUtcLocalDateTime(end_time) : null;
            List<SmsMessage> messages = smsService.searchMessages(id, receiverPhone, keyword, phone, startTime, endTime, userId);
            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (Exception e) {
            log.error("Failed to search messages", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private static LocalDateTime parseUtcLocalDateTime(String s) {
        if (s.contains("Z") || s.matches(".*[+-]\\d{2}:?\\d{2}$")) {
            return OffsetDateTime.parse(s, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                    .toInstant().atZone(ZoneOffset.UTC).toLocalDateTime();
        }
        String normalized = s.length() == 16 ? s + ":00" : s;
        return LocalDateTime.parse(normalized, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
