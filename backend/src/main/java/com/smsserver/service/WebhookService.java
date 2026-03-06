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
import java.time.ZoneOffset;
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
        device.setLastHeartbeatAt(LocalDateTime.now(ZoneOffset.UTC));
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

        // 6. Build response with commands (update DB first to avoid inconsistent state)
        WebhookResponse response = new WebhookResponse();
        for (PendingSms task : pendingTasks) {
            task.setStatus("sent");
            task.setSentAt(LocalDateTime.now());
            pendingSmsMapper.updateById(task);
            response.getCommands().add(
                WebhookResponse.Command.sendSms(
                    task.getId(),
                    task.getPhoneNumber(),
                    task.getContent()
                )
            );
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
        Device device = deviceMapper.selectById(deviceId);
        String receiverPhone = device != null ? device.getCurrentPhoneNumber() : null;
        for (WebhookRequest.NewMessage msg : messages) {
            SmsMessage smsMessage = new SmsMessage();
            smsMessage.setDeviceId(deviceId);
            smsMessage.setReceiverPhone(receiverPhone);
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
            } else {
                smsMessage.setCreatedAt(LocalDateTime.now());
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
            } else {
                missedCall.setCallTime(LocalDateTime.now());
            }

            missedCall.setCreatedAt(LocalDateTime.now());
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
