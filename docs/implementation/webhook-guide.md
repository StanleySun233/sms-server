# Webhook Heartbeat Implementation Guide

## Overview
The webhook heartbeat endpoint is the **most critical component** of the SMS server. It handles all communication from 4G devices, including status updates, new messages, and pending message retrieval.

## Webhook Flow

```
4G Device (every 60 seconds)
    ↓
POST /api/webhook/{webhook_token}
    ↓
WebhookController
    ↓
1. Validate token & find device
2. Update device heartbeat timestamp
3. Detect SIM card changes
4. Save new messages & missed calls
5. Fetch pending SMS from Redis queue
6. Return commands to device
```

## Request/Response Format

### Request Body
```json
{
  "device_info": {
    "phone_number": "1234567890",
    "imei": "123456789012345",
    "signal_strength": 85,
    "battery_level": 75
  },
  "new_messages": [
    {
      "phone": "0987654321",
      "content": "Hello, this is a test message",
      "timestamp": "2026-03-06T12:00:00Z"
    }
  ],
  "missed_calls": [
    {
      "phone": "0987654321",
      "timestamp": "2026-03-06T11:55:00Z"
    }
  ]
}
```

### Response Body
```json
{
  "commands": [
    {
      "type": "send_sms",
      "task_id": "123",
      "phone": "0987654321",
      "content": "This is a reply"
    },
    {
      "type": "send_sms",
      "task_id": "124",
      "phone": "1112223333",
      "content": "Another message"
    }
  ]
}
```

## Backend Implementation

### 1. DTOs

**WebhookRequest.java:**
```java
package com.smsserver.dto;

import lombok.Data;
import java.util.List;

@Data
public class WebhookRequest {
    private DeviceInfo deviceInfo;
    private List<NewMessage> newMessages;
    private List<MissedCall> missedCalls;

    @Data
    public static class DeviceInfo {
        private String phoneNumber;
        private String imei;
        private Integer signalStrength;
        private Integer batteryLevel;
    }

    @Data
    public static class NewMessage {
        private String phone;
        private String content;
        private String timestamp; // ISO 8601 format
    }

    @Data
    public static class MissedCall {
        private String phone;
        private String timestamp; // ISO 8601 format
    }
}
```

**WebhookResponse.java:**
```java
package com.smsserver.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class WebhookResponse {
    private List<Command> commands = new ArrayList<>();

    @Data
    public static class Command {
        private String type; // "send_sms"
        private String taskId;
        private String phone;
        private String content;

        public static Command sendSms(Long taskId, String phone, String content) {
            Command command = new Command();
            command.setType("send_sms");
            command.setTaskId(taskId.toString());
            command.setPhone(phone);
            command.setContent(content);
            return command;
        }
    }
}
```

### 2. Webhook Service

**WebhookService.java:**
```java
package com.smsserver.service;

import com.smsserver.dto.WebhookRequest;
import com.smsserver.dto.WebhookResponse;
import com.smsserver.entity.*;
import com.smsserver.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {
    private final DeviceMapper deviceMapper;
    private final SmsMessageMapper smsMessageMapper;
    private final MissedCallMapper missedCallMapper;
    private final PendingSmsMapper pendingSmsMapper;
    private final SimChangeLogMapper simChangeLogMapper;
    private final RedisService redisService;

    @Transactional
    public WebhookResponse processHeartbeat(String webhookToken, WebhookRequest request) {
        // 1. Find device by webhook token
        Device device = deviceMapper.findByWebhookToken(webhookToken);
        if (device == null) {
            throw new RuntimeException("Invalid webhook token");
        }

        log.info("Processing heartbeat for device {} (user {})", device.getId(), device.getUserId());

        // 2. Update device heartbeat and info
        device.setLastHeartbeatAt(LocalDateTime.now());
        if (request.getDeviceInfo() != null) {
            device.setImei(request.getDeviceInfo().getImei());

            // Check for SIM card change
            String newPhoneNumber = request.getDeviceInfo().getPhoneNumber();
            if (newPhoneNumber != null && !newPhoneNumber.equals(device.getCurrentPhoneNumber())) {
                logSimChange(device, newPhoneNumber);
                device.setCurrentPhoneNumber(newPhoneNumber);
            }
        }
        deviceMapper.updateById(device);

        // 3. Save new messages
        if (request.getNewMessages() != null && !request.getNewMessages().isEmpty()) {
            saveNewMessages(device.getId(), request.getNewMessages());
            // Invalidate unread count cache
            redisService.deleteDeviceUnreadCount(device.getId());
        }

        // 4. Save missed calls
        if (request.getMissedCalls() != null && !request.getMissedCalls().isEmpty()) {
            saveMissedCalls(device.getId(), request.getMissedCalls());
        }

        // 5. Fetch pending SMS tasks from Redis
        List<PendingSms> pendingTasks = redisService.popPendingSmsTasks(device.getId());

        // 6. Build response with commands
        WebhookResponse response = new WebhookResponse();
        for (PendingSms task : pendingTasks) {
            response.getCommands().add(
                WebhookResponse.Command.sendSms(
                    task.getId(),
                    task.getPhoneNumber(),
                    task.getContent()
                )
            );

            // Update task status to 'sent'
            task.setStatus("sent");
            task.setSentAt(LocalDateTime.now());
            pendingSmsMapper.updateById(task);
        }

        // Update device status cache
        redisService.setDeviceStatus(device.getId(), "online");

        log.info("Heartbeat processed: {} new messages, {} missed calls, {} pending SMS",
                request.getNewMessages() != null ? request.getNewMessages().size() : 0,
                request.getMissedCalls() != null ? request.getMissedCalls().size() : 0,
                pendingTasks.size());

        return response;
    }

    private void saveNewMessages(Long deviceId, List<WebhookRequest.NewMessage> messages) {
        for (WebhookRequest.NewMessage msg : messages) {
            SmsMessage smsMessage = new SmsMessage();
            smsMessage.setDeviceId(deviceId);
            smsMessage.setPhoneNumber(msg.getPhone());
            smsMessage.setContent(msg.getContent());
            smsMessage.setDirection("received");
            smsMessage.setStatus("delivered");

            // Parse timestamp
            if (msg.getTimestamp() != null) {
                try {
                    smsMessage.setCreatedAt(
                        LocalDateTime.parse(msg.getTimestamp(), DateTimeFormatter.ISO_DATE_TIME)
                    );
                } catch (Exception e) {
                    log.warn("Failed to parse timestamp: {}", msg.getTimestamp());
                    smsMessage.setCreatedAt(LocalDateTime.now());
                }
            }

            smsMessageMapper.insert(smsMessage);
        }
    }

    private void saveMissedCalls(Long deviceId, List<WebhookRequest.MissedCall> calls) {
        for (WebhookRequest.MissedCall call : calls) {
            MissedCall missedCall = new MissedCall();
            missedCall.setDeviceId(deviceId);
            missedCall.setPhoneNumber(call.getPhone());

            // Parse timestamp
            if (call.getTimestamp() != null) {
                try {
                    missedCall.setCallTime(
                        LocalDateTime.parse(call.getTimestamp(), DateTimeFormatter.ISO_DATE_TIME)
                    );
                } catch (Exception e) {
                    log.warn("Failed to parse timestamp: {}", call.getTimestamp());
                    missedCall.setCallTime(LocalDateTime.now());
                }
            }

            missedCallMapper.insert(missedCall);
        }
    }

    private void logSimChange(Device device, String newPhoneNumber) {
        SimChangeLog log = new SimChangeLog();
        log.setDeviceId(device.getId());
        log.setOldPhoneNumber(device.getCurrentPhoneNumber());
        log.setNewPhoneNumber(newPhoneNumber);
        log.setChangedAt(LocalDateTime.now());
        simChangeLogMapper.insert(log);

        this.log.info("SIM card changed for device {}: {} -> {}",
                device.getId(), device.getCurrentPhoneNumber(), newPhoneNumber);
    }
}
```

### 3. Webhook Controller

**WebhookController.java:**
```java
package com.smsserver.controller;

import com.smsserver.dto.WebhookRequest;
import com.smsserver.dto.WebhookResponse;
import com.smsserver.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/webhook")
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
            return ResponseEntity.status(500).body(new WebhookResponse());
        }
    }

    @GetMapping("/test")
    public ResponseEntity<?> test() {
        return ResponseEntity.ok("Webhook endpoint is running");
    }
}
```

### 4. Device Mapper Addition

Add method to `DeviceMapper.java`:
```java
@Select("SELECT * FROM devices WHERE webhook_token = #{token}")
Device findByWebhookToken(@Param("token") String token);
```

### 5. Redis Service Additions

Add to `RedisService.java`:
```java
// SMS task queue operations
public void pushPendingSmsTask(Long deviceId, Long taskId) {
    String key = "task:sms:" + deviceId;
    redisTemplate.opsForList().rightPush(key, taskId.toString());
}

public List<PendingSms> popPendingSmsTasks(Long deviceId) {
    String key = "task:sms:" + deviceId;
    List<PendingSms> tasks = new ArrayList<>();

    // Pop up to 10 tasks at once
    for (int i = 0; i < 10; i++) {
        String taskId = redisTemplate.opsForList().leftPop(key);
        if (taskId == null) break;

        PendingSms task = pendingSmsMapper.selectById(Long.parseLong(taskId));
        if (task != null && "pending".equals(task.getStatus())) {
            tasks.add(task);
        }
    }

    return tasks;
}

// Device status cache
public void setDeviceStatus(Long deviceId, String status) {
    String key = "device:status:" + deviceId;
    redisTemplate.opsForValue().set(key, status, 10, TimeUnit.MINUTES);
}

public String getDeviceStatus(Long deviceId) {
    String key = "device:status:" + deviceId;
    return redisTemplate.opsForValue().get(key);
}

// Unread count cache
public void deleteDeviceUnreadCount(Long deviceId) {
    String key = "device:unread:" + deviceId;
    redisTemplate.delete(key);
}
```

## Device Status Calculation

Device status is calculated based on `last_heartbeat_at`:

- **Online**: Last heartbeat < 3 minutes ago
- **Warning**: Last heartbeat 3-5 minutes ago
- **Offline**: Last heartbeat > 5 minutes ago

Implementation in `DeviceService.java`:
```java
public String calculateDeviceStatus(Device device) {
    if (device.getLastHeartbeatAt() == null) {
        return "offline";
    }

    long minutesSinceHeartbeat = ChronoUnit.MINUTES.between(
        device.getLastHeartbeatAt(),
        LocalDateTime.now()
    );

    if (minutesSinceHeartbeat < 3) {
        return "online";
    } else if (minutesSinceHeartbeat < 5) {
        return "warning";
    } else {
        return "offline";
    }
}
```

## Error Handling Strategy

**Critical Rule**: Always return HTTP 200 with valid JSON, even on errors. This prevents the device from thinking the server is down.

```java
try {
    // Process webhook
} catch (Exception e) {
    log.error("Error processing webhook", e);
    // Return empty commands - device will retry next heartbeat
    return ResponseEntity.ok(new WebhookResponse());
}
```

## Security Considerations

1. **Token Validation**: Always validate webhook token before processing
2. **Rate Limiting**: Nginx limits webhook endpoint to 2 requests/second per IP
3. **No Authentication**: Webhook endpoint is public (secured by token only)
4. **Input Validation**: Validate all input fields (phone numbers, timestamps, content length)
5. **SQL Injection**: MyBatis parameterized queries prevent injection

## Performance Optimization

1. **Batch Operations**: Use MyBatis batch insert for multiple messages/calls
2. **Redis Caching**: Cache device status to reduce database queries
3. **Async Processing**: Consider async processing for heavy operations
4. **Connection Pooling**: Proper database connection pool configuration
5. **Logging**: Use appropriate log levels (debug for normal operation, info for important events)

## Testing

### Manual Testing
```bash
# Test webhook endpoint
curl -X POST http://localhost/api/webhook/your-token-here \
  -H "Content-Type: application/json" \
  -d '{
    "device_info": {
      "phone_number": "1234567890",
      "imei": "123456789012345",
      "signal_strength": 85,
      "battery_level": 75
    },
    "new_messages": [
      {
        "phone": "0987654321",
        "content": "Test message",
        "timestamp": "2026-03-06T12:00:00Z"
      }
    ],
    "missed_calls": []
  }'
```

### Expected Behavior
1. Device `last_heartbeat_at` updated in database
2. New messages saved to `sms_message` table
3. Device status changed to "online" in Redis
4. Response contains any pending SMS commands
5. Logs show successful processing

### Edge Cases to Test
- Invalid webhook token → Return 200 with empty commands
- Missing device_info → Process normally (optional field)
- Malformed timestamp → Use current time instead
- Empty arrays → Process normally
- Very long message content → Validate max length
- Duplicate messages → Handle gracefully (idempotency)
- SIM card change → Log in `sim_change_log` table

## Monitoring Recommendations

1. **Metrics to Track**:
   - Webhook requests per minute
   - Average processing time
   - Error rate
   - Pending SMS queue length
   - Device status distribution

2. **Alerts to Set**:
   - Webhook error rate > 5%
   - Average processing time > 1 second
   - No heartbeat from device > 10 minutes
   - Redis queue size > 1000

3. **Log Analysis**:
   - Track unique devices calling webhook
   - Monitor SIM card changes
   - Identify devices with frequent timeouts
