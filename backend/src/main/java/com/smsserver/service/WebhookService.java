package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smsserver.dto.webhook.WebhookRequest;
import com.smsserver.dto.webhook.WebhookResponse;
import com.smsserver.entity.*;
import com.smsserver.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {
    public static class InvalidDeviceTokenException extends RuntimeException {
    }

    private final DeviceMapper deviceMapper;
    private final SmsMessageMapper smsMessageMapper;
    private final MissedCallMapper missedCallMapper;
    private final PendingSmsMapper pendingSmsMapper;
    private final SimChangeLogMapper simChangeLogMapper;
    private final WebhookLogMapper webhookLogMapper;
    private final RedisService redisService;
    private final SmsDispatchService dispatchService;

    @Transactional
    public WebhookResponse processHeartbeat(String webhookToken, WebhookRequest request) {
        // 1. Find device by webhook token
        Device device = deviceMapper.selectOne(new LambdaQueryWrapper<Device>()
                .eq(Device::getWebhookToken, webhookToken)
                .last("FOR UPDATE"));
        if (device == null) {
            throw new InvalidDeviceTokenException();
        }

        log.info("Processing heartbeat for device {} (user {})", device.getId(), device.getUserId());

        // 2. Update device heartbeat and info
        device.setLastHeartbeatAt(LocalDateTime.now(ZoneOffset.UTC));
        String simId = request.getDeviceInfo() == null ? null : request.getDeviceInfo().getSimId();
        boolean hasSim = simId != null && simId.matches("[0-9]{15,24}");
        if (request.getDeviceInfo() != null || request.getSmsProtocol() != null) {
            boolean hasSession = request.getDeviceSession() != null && request.getDeviceSession().matches("[a-z0-9-]{8,64}");
            device.setSmsProtocol(Integer.valueOf(2).equals(request.getSmsProtocol()) && hasSim && hasSession ? 2 : 0);
        }
        if (request.getDeviceInfo() != null) {
            if (hasSim) {
                device.setCurrentSimId(simId);
            }
            device.setImei(request.getDeviceInfo().getImei());
            device.setSignalStrength(request.getDeviceInfo().getSignalStrength());
            if (request.getDeviceInfo().getLatitude() != null) {
                device.setLatitude(BigDecimal.valueOf(request.getDeviceInfo().getLatitude()));
            }
            if (request.getDeviceInfo().getLongitude() != null) {
                device.setLongitude(BigDecimal.valueOf(request.getDeviceInfo().getLongitude()));
            }
            String newPhoneNumber = request.getDeviceInfo().getPhoneNumber();
            if (newPhoneNumber != null && !newPhoneNumber.equals(device.getCurrentPhoneNumber())) {
                logSimChange(device, newPhoneNumber);
                device.setCurrentPhoneNumber(newPhoneNumber);
            }
        }
        deviceMapper.updateById(device);

        // 3. Save new messages
        boolean hasNewMessages = request.getNewMessages() != null && !request.getNewMessages().isEmpty();
        if (hasNewMessages) {
            saveNewMessages(device.getId(), request.getNewMessages());
        }

        // 4. Save missed calls
        if (request.getMissedCalls() != null && !request.getMissedCalls().isEmpty()) {
            saveMissedCalls(device.getId(), request.getMissedCalls());
        }

        WebhookResponse response = new WebhookResponse();
        dispatchService.processHeartbeat(device, request, response);

        redisService.refreshHeartbeatAfterCommit(device.getId(), hasNewMessages);

        log.info("Heartbeat processed: {} new messages, {} missed calls, {} pending SMS",
                request.getNewMessages() != null ? request.getNewMessages().size() : 0,
                request.getMissedCalls() != null ? request.getMissedCalls().size() : 0,
                response.getCommands().size());

        WebhookLog webhookLog = new WebhookLog();
        webhookLog.setDeviceId(device.getId());

        webhookLog.setReceivedAt(LocalDateTime.now(ZoneOffset.UTC));
        webhookLog.setNewMessagesCount(request.getNewMessages() != null ? request.getNewMessages().size() : 0);
        webhookLog.setMissedCallsCount(request.getMissedCalls() != null ? request.getMissedCalls().size() : 0);
        webhookLog.setCommandsCount(response.getCommands().size());
        if (request.getDeviceInfo() != null) {
            if (request.getDeviceInfo().getLatitude() != null) {
                webhookLog.setLatitude(BigDecimal.valueOf(request.getDeviceInfo().getLatitude()));
            }
            if (request.getDeviceInfo().getLongitude() != null) {
                webhookLog.setLongitude(BigDecimal.valueOf(request.getDeviceInfo().getLongitude()));
            }
        }
        webhookLogMapper.insert(webhookLog);

        return response;
    }

    private void saveNewMessages(Long deviceId, List<WebhookRequest.NewMessage> messages) {
        Device device = deviceMapper.selectById(deviceId);
        String receiverPhone = device != null ? device.getCurrentPhoneNumber() : null;
        for (WebhookRequest.NewMessage msg : messages) {
            if (msg.getEventId() != null && smsMessageMapper.exists(new LambdaQueryWrapper<SmsMessage>()
                    .eq(SmsMessage::getDeviceId, deviceId)
                    .eq(SmsMessage::getInboundEventId, msg.getEventId()))) continue;
            SmsMessage smsMessage = new SmsMessage();
            smsMessage.setInboundEventId(msg.getEventId());
            smsMessage.setDeviceId(deviceId);
            String eventLine = msg.getReceiverPhone();
            smsMessage.setReceiverPhone(eventLine != null && eventLine.matches("\\+?[0-9]{5,19}")
                    ? eventLine : receiverPhone);
            smsMessage.setPhoneNumber(msg.getPhone());
            smsMessage.setContent(msg.getContent());
            smsMessage.setDirection("received");
            smsMessage.setStatus("delivered");

            if (msg.getTimestamp() != null) {
                LocalDateTime utc = parseToUtcLocalDateTime(msg.getTimestamp());
                smsMessage.setCreatedAt(utc != null ? utc : LocalDateTime.now(ZoneOffset.UTC));
            } else {
                smsMessage.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            }

            smsMessageMapper.insert(smsMessage);
        }
    }

    private void saveMissedCalls(Long deviceId, List<WebhookRequest.MissedCall> calls) {
        for (WebhookRequest.MissedCall call : calls) {
            if (call.getEventId() != null && missedCallMapper.exists(new LambdaQueryWrapper<MissedCall>()
                    .eq(MissedCall::getDeviceId, deviceId)
                    .eq(MissedCall::getInboundEventId, call.getEventId()))) continue;
            MissedCall missedCall = new MissedCall();
            missedCall.setInboundEventId(call.getEventId());
            missedCall.setDeviceId(deviceId);
            missedCall.setPhoneNumber(call.getPhone());

            if (call.getTimestamp() != null) {
                LocalDateTime utc = parseToUtcLocalDateTime(call.getTimestamp());
                missedCall.setCallTime(utc != null ? utc : LocalDateTime.now(ZoneOffset.UTC));
            } else {
                missedCall.setCallTime(LocalDateTime.now(ZoneOffset.UTC));
            }

            missedCall.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            missedCallMapper.insert(missedCall);
        }
    }

    private LocalDateTime parseToUtcLocalDateTime(String timestamp) {
        try {
            if (timestamp.contains("Z") || timestamp.matches(".*[+-]\\d{2}:?\\d{2}$")) {
                return OffsetDateTime.parse(timestamp, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                        .toInstant().atZone(ZoneOffset.UTC).toLocalDateTime();
            }
            return LocalDateTime.parse(timestamp, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    .atZone(ZoneId.of("Asia/Shanghai"))
                    .toInstant().atZone(ZoneOffset.UTC).toLocalDateTime();
        } catch (Exception e) {
            log.warn("Failed to parse timestamp: {}", timestamp);
            return null;
        }
    }

    private void logSimChange(Device device, String newPhoneNumber) {
        SimChangeLog log = new SimChangeLog();
        log.setDeviceId(device.getId());
        log.setOldPhoneNumber(device.getCurrentPhoneNumber());
        log.setNewPhoneNumber(newPhoneNumber);
        log.setChangedAt(LocalDateTime.now(ZoneOffset.UTC));
        simChangeLogMapper.insert(log);

        this.log.info("SIM card changed for device {}: {} -> {}",
                device.getId(), device.getCurrentPhoneNumber(), newPhoneNumber);
    }
}
