package com.smsserver.controller;

import com.smsserver.dto.webhook.WebhookRequest;
import com.smsserver.service.WebhookService;
import com.smsserver.service.RedisService;
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
    private final RedisService redisService;

    @PostMapping("/{token}")
    public ResponseEntity<?> handleHeartbeat(
            @PathVariable String token,
            @RequestBody WebhookRequest request) {
        if (!token.matches("[a-z0-9]{16}")) return ResponseEntity.status(401).build();
        RedisService.HeartbeatLease lease = redisService.acquireHeartbeatLease(token);
        if (lease.busy()) return ResponseEntity.status(409).build();
        try {
            return ResponseEntity.ok(webhookService.processHeartbeat(token, request));
        } catch (WebhookService.InvalidDeviceTokenException e) {
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("Webhook processing failed ({})", e.getClass().getSimpleName());
            return ResponseEntity.status(500).build();
        } finally {
            redisService.releaseHeartbeatLease(lease);
        }
    }

    @GetMapping("/test")
    public ResponseEntity<?> test() {
        return ResponseEntity.ok("Webhook endpoint is running");
    }
}
