package com.smsserver.controller;

import com.smsserver.dto.webhook.WebhookRequest;
import com.smsserver.dto.webhook.WebhookResponse;
import com.smsserver.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/webhook")
@RequiredArgsConstructor
public class WebhookController {
    private final WebhookService webhookService;

    @PostMapping("/{token}")
    public ResponseEntity<?> handleHeartbeat(
            @PathVariable String token,
            @RequestBody WebhookRequest request) {
        try {
            log.debug("Received heartbeat for token: {}", token);
            WebhookResponse response = webhookService.processHeartbeat(token, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Webhook processing failed: {}", e.getMessage());
            // Return empty commands even on error to keep device running
            return ResponseEntity.ok(new WebhookResponse());
        } catch (Exception e) {
            log.error("Unexpected error in webhook", e);
            return ResponseEntity.ok(new WebhookResponse());
        }
    }

    @GetMapping("/test")
    public ResponseEntity<?> test() {
        return ResponseEntity.ok("Webhook endpoint is running");
    }
}
