package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smsserver.dto.sms.ConversationResponse;
import com.smsserver.dto.sms.LineSummaryResponse;
import com.smsserver.entity.Device;
import com.smsserver.entity.PendingSms;
import com.smsserver.entity.SimChangeLog;
import com.smsserver.entity.SmsMessage;
import com.smsserver.mapper.DeviceMapper;
import com.smsserver.mapper.PendingSmsMapper;
import com.smsserver.mapper.SimChangeLogMapper;
import com.smsserver.mapper.SmsMessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {
    public static final String UNKNOWN_RECEIVER = "__unknown__";

    private final SmsMessageMapper smsMessageMapper;
    private final PendingSmsMapper pendingSmsMapper;
    private final DeviceMapper deviceMapper;
    private final SimChangeLogMapper simChangeLogMapper;
    private final DeviceService deviceService;
    private final RedisService redisService;
    private final SmsDispatchService dispatchService;

    public List<String> getDeviceLineNumbers(Long deviceId, Long userId) {
        deviceService.getDevice(deviceId, userId);
        Set<String> phones = new LinkedHashSet<>();
        Device device = deviceMapper.selectById(deviceId);
        if (device != null && device.getCurrentPhoneNumber() != null) {
            phones.add(device.getCurrentPhoneNumber());
        }
        LambdaQueryWrapper<SimChangeLog> logWrapper = new LambdaQueryWrapper<>();
        logWrapper.eq(SimChangeLog::getDeviceId, deviceId).orderByAsc(SimChangeLog::getChangedAt);
        List<SimChangeLog> logs = simChangeLogMapper.selectList(logWrapper);
        for (SimChangeLog log : logs) {
            if (log.getOldPhoneNumber() != null) phones.add(log.getOldPhoneNumber());
            if (log.getNewPhoneNumber() != null) phones.add(log.getNewPhoneNumber());
        }
        return new ArrayList<>(phones);
    }

    public List<LineSummaryResponse> getLineSummaries(Long deviceId, Long userId) {
        List<String> lineNumbers = getDeviceLineNumbers(deviceId, userId);
        List<LineSummaryResponse> result = new ArrayList<>();
        for (String receiverPhone : lineNumbers) {
            LineSummaryResponse summary = new LineSummaryResponse();
            summary.setReceiverPhone(receiverPhone);
            LambdaQueryWrapper<SmsMessage> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(SmsMessage::getDeviceId, deviceId)
                    .eq(SmsMessage::getReceiverPhone, receiverPhone)
                    .orderByDesc(SmsMessage::getCreatedAt)
                    .last("LIMIT 1");
            SmsMessage last = smsMessageMapper.selectOne(wrapper);
            if (last != null) {
                summary.setLastMessage(last.getContent());
                summary.setLastMessageDirection(last.getDirection());
                summary.setLastMessageTime(last.getCreatedAt());
                LambdaQueryWrapper<SmsMessage> unreadWrapper = new LambdaQueryWrapper<>();
                unreadWrapper.eq(SmsMessage::getDeviceId, deviceId)
                        .eq(SmsMessage::getReceiverPhone, receiverPhone)
                        .eq(SmsMessage::getDirection, "received")
                        .isNull(SmsMessage::getReadAt);
                summary.setUnreadCount(smsMessageMapper.selectCount(unreadWrapper).intValue());
            } else {
                summary.setLastMessage(null);
                summary.setLastMessageTime(null);
                summary.setUnreadCount(0);
            }
            result.add(summary);
        }
        LambdaQueryWrapper<SmsMessage> nullReceiverWrapper = new LambdaQueryWrapper<>();
        nullReceiverWrapper.eq(SmsMessage::getDeviceId, deviceId)
                .and(w -> w.isNull(SmsMessage::getReceiverPhone).or().eq(SmsMessage::getReceiverPhone, ""))
                .orderByDesc(SmsMessage::getCreatedAt)
                .last("LIMIT 1");
        SmsMessage unknownLast = smsMessageMapper.selectOne(nullReceiverWrapper);
        if (unknownLast != null) {
            LineSummaryResponse unknownSummary = new LineSummaryResponse();
            unknownSummary.setReceiverPhone(UNKNOWN_RECEIVER);
            unknownSummary.setLastMessage(unknownLast.getContent());
            unknownSummary.setLastMessageDirection(unknownLast.getDirection());
            unknownSummary.setLastMessageTime(unknownLast.getCreatedAt());
            LambdaQueryWrapper<SmsMessage> unreadWrapper = new LambdaQueryWrapper<>();
            unreadWrapper.eq(SmsMessage::getDeviceId, deviceId)
                    .and(w -> w.isNull(SmsMessage::getReceiverPhone).or().eq(SmsMessage::getReceiverPhone, ""))
                    .eq(SmsMessage::getDirection, "received")
                    .isNull(SmsMessage::getReadAt);
            unknownSummary.setUnreadCount(smsMessageMapper.selectCount(unreadWrapper).intValue());
            result.add(unknownSummary);
        }
        LambdaQueryWrapper<SmsMessage> noneReceiverWrapper = new LambdaQueryWrapper<>();
        noneReceiverWrapper.eq(SmsMessage::getDeviceId, deviceId)
                .eq(SmsMessage::getReceiverPhone, "none")
                .orderByDesc(SmsMessage::getCreatedAt)
                .last("LIMIT 1");
        SmsMessage noneLast = smsMessageMapper.selectOne(noneReceiverWrapper);
        if (noneLast != null) {
            LineSummaryResponse noneSummary = new LineSummaryResponse();
            noneSummary.setReceiverPhone("none");
            noneSummary.setLastMessage(noneLast.getContent());
            noneSummary.setLastMessageDirection(noneLast.getDirection());
            noneSummary.setLastMessageTime(noneLast.getCreatedAt());
            LambdaQueryWrapper<SmsMessage> unreadWrapper = new LambdaQueryWrapper<>();
            unreadWrapper.eq(SmsMessage::getDeviceId, deviceId)
                    .eq(SmsMessage::getReceiverPhone, "none")
                    .eq(SmsMessage::getDirection, "received")
                    .isNull(SmsMessage::getReadAt);
            noneSummary.setUnreadCount(smsMessageMapper.selectCount(unreadWrapper).intValue());
            result.add(noneSummary);
        }
        result.sort((a, b) -> {
            LocalDateTime ta = a.getLastMessageTime();
            LocalDateTime tb = b.getLastMessageTime();
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;
            return tb.compareTo(ta);
        });
        return result;
    }

    public List<ConversationResponse> getConversations(Long deviceId, Long userId) {
        return getConversations(deviceId, null, userId);
    }

    public List<ConversationResponse> getConversations(Long deviceId, String receiverPhone, Long userId) {
        deviceService.getDevice(deviceId, userId);
        return smsMessageMapper.findConversationSummaries(deviceId, receiverPhone);
    }
    public Page<SmsMessage> getConversationMessages(Long deviceId, String phone, Long userId, int pageNum, int pageSize) {
        return getConversationMessages(deviceId, null, phone, userId, pageNum, pageSize);
    }

    public Page<SmsMessage> getConversationMessages(Long deviceId, String receiverPhone, String phone, Long userId, int pageNum, int pageSize) {
        deviceService.getDevice(deviceId, userId);
        Page<SmsMessage> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<SmsMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SmsMessage::getDeviceId, deviceId)
                .eq(SmsMessage::getPhoneNumber, phone)
                .orderByDesc(SmsMessage::getCreatedAt, SmsMessage::getId);
        if (receiverPhone != null && !receiverPhone.isEmpty()) {
            if (UNKNOWN_RECEIVER.equals(receiverPhone)) {
                wrapper.and(w -> w.isNull(SmsMessage::getReceiverPhone).or().eq(SmsMessage::getReceiverPhone, ""));
            } else {
                wrapper.eq(SmsMessage::getReceiverPhone, receiverPhone);
            }
        }
        page = smsMessageMapper.selectPage(page, wrapper);
        Set<Long> pendingIds = page.getRecords().stream()
                .filter(message -> "pending".equals(message.getStatus()) && message.getPendingSmsId() != null)
                .map(SmsMessage::getPendingSmsId)
                .collect(Collectors.toSet());
        if (!pendingIds.isEmpty()) {
            var statusById = pendingSmsMapper.selectBatchIds(pendingIds).stream()
                    .filter(task -> task.getStatus() != null)
                    .collect(Collectors.toMap(PendingSms::getId, PendingSms::getStatus));
            page.getRecords().forEach(message -> {
                if ("pending".equals(message.getStatus()) && statusById.containsKey(message.getPendingSmsId())) {
                    message.setStatus(statusById.get(message.getPendingSmsId()));
                }
            });
        }
        return page;
    }

    @Transactional
    public SmsMessage sendMessage(Long deviceId, String phone, String content, String requestId, Long userId) {
        Device device = deviceMapper.selectOne(new LambdaQueryWrapper<Device>()
                .eq(Device::getId, deviceId)
                .eq(Device::getUserId, userId)
                .last("FOR UPDATE"));
        if (device == null) throw new IllegalArgumentException("Device not found");
        if (requestId != null) {
            PendingSms existing = pendingSmsMapper.selectOne(new LambdaQueryWrapper<PendingSms>()
                    .eq(PendingSms::getDeviceId, deviceId)
                    .eq(PendingSms::getRequestId, requestId));
            if (existing != null) {
                if (!existing.getPhoneNumber().equals(phone) || !existing.getContent().equals(content)) {
                    throw new IllegalArgumentException("Request ID belongs to a different message");
                }
                return smsMessageMapper.selectOne(new LambdaQueryWrapper<SmsMessage>()
                        .eq(SmsMessage::getPendingSmsId, existing.getId()));
            }
        }

        if (!Integer.valueOf(2).equals(device.getSmsProtocol()) || device.getCurrentSimId() == null) {
            throw new IllegalArgumentException("Wait for compatible firmware to report its SIM before sending");
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        PendingSms pendingSms = new PendingSms();
        pendingSms.setRequestId(requestId);
        pendingSms.setAttemptCount(1);
        pendingSms.setExpectedSim(device.getCurrentSimId());
        pendingSms.setAttemptExpiresAt(now.plusHours(24));
        pendingSms.setDeviceId(deviceId);
        pendingSms.setPhoneNumber(phone);
        pendingSms.setContent(content);
        pendingSms.setStatus("pending");
        pendingSmsMapper.insert(pendingSms);

        SmsMessage smsMessage = new SmsMessage();
        smsMessage.setDeviceId(deviceId);
        smsMessage.setReceiverPhone(device.getCurrentPhoneNumber());
        smsMessage.setPhoneNumber(phone);
        smsMessage.setContent(content);
        smsMessage.setDirection("sent");
        smsMessage.setStatus("pending");
        smsMessage.setPendingSmsId(pendingSms.getId());
        smsMessageMapper.insert(smsMessage);

        redisService.trackSmsAfterCommit(pendingSms);

        log.info("Created pending SMS {} and sms_message {} for device {}", pendingSms.getId(), smsMessage.getId(), deviceId);
        return smsMessage;
    }

    public List<PendingSms> getSendLogs(Long deviceId, Long userId, int limit) {
        deviceService.getDevice(deviceId, userId);
        LambdaQueryWrapper<PendingSms> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PendingSms::getDeviceId, deviceId)
                .orderByDesc(PendingSms::getCreatedAt)
                .last("LIMIT " + Math.min(limit, 100));
        return pendingSmsMapper.selectList(wrapper);
    }

    @Transactional
    public SmsMessage retryMessage(Long deviceId, Long messageId, Long userId) {
        Device device = deviceService.getDevice(deviceId, userId);
        SmsMessage message = smsMessageMapper.selectById(messageId);
        if (message == null || !message.getDeviceId().equals(deviceId) || message.getPendingSmsId() == null) {
            throw new RuntimeException("Message not found or not retryable");
        }
        PendingSms pending = pendingSmsMapper.selectOne(new LambdaQueryWrapper<PendingSms>()
                .eq(PendingSms::getId, message.getPendingSmsId())
                .eq(PendingSms::getDeviceId, deviceId)
                .last("FOR UPDATE"));
        if (pending == null) {
            throw new RuntimeException("Pending task not found");
        }
        if (!"failed".equals(pending.getStatus()) && !"expired".equals(pending.getStatus())) {
            throw new IllegalArgumentException("Only failed or expired messages can be retried");
        }
        if (pending.getAttemptCount() >= SmsDispatchService.MAX_ATTEMPTS) {
            throw new IllegalArgumentException("This message has reached the send attempt limit");
        }
        if (!Integer.valueOf(2).equals(device.getSmsProtocol()) || device.getCurrentSimId() == null
                || !device.getCurrentSimId().equals(pending.getExpectedSim())) {
            throw new IllegalArgumentException("The original SIM must be online to retry this message");
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        pending.setAttemptCount(pending.getAttemptCount() + 1);
        pending.setAttemptOfferCount(0);
        pending.setAttemptExpiresAt(now.plusHours(24));
        dispatchService.transition(pending, "pending", now);
        message.setStatus("pending");
        log.info("Retry message {} pending_sms {}", messageId, pending.getId());
        return message;
    }

    /**
     * Mark messages as read (batch update)
     */
    @Transactional
    public void markMessagesAsRead(List<Long> messageIds, Long userId) {
        if (messageIds == null || messageIds.isEmpty()) {
            return;
        }

        List<Long> devices = smsMessageMapper.selectList(new LambdaQueryWrapper<SmsMessage>()
                        .select(SmsMessage::getDeviceId)
                        .in(SmsMessage::getId, messageIds)).stream()
                .map(SmsMessage::getDeviceId).distinct().sorted().toList();
        if (devices.isEmpty()) return;
        List<Device> ownedDevices = deviceMapper.selectList(new LambdaQueryWrapper<Device>()
                .select(Device::getId)
                .in(Device::getId, devices)
                .eq(Device::getUserId, userId)
                .orderByAsc(Device::getId)
                .last("FOR UPDATE"));
        if (ownedDevices.size() != devices.size()) {
            throw new IllegalArgumentException("Access denied");
        }

        int updated = smsMessageMapper.update(null, new LambdaUpdateWrapper<SmsMessage>()
                .in(SmsMessage::getId, messageIds)
                .in(SmsMessage::getDeviceId, devices)
                .eq(SmsMessage::getDirection, "received")
                .isNull(SmsMessage::getReadAt)
                .set(SmsMessage::getReadAt, LocalDateTime.now(ZoneOffset.UTC)));
        if (updated > 0) redisService.invalidateSmsUnreadCountsAfterCommit(devices);
        log.debug("Marked {} messages as read", updated);
    }

    /**
     * Search messages by keyword, phone, and date range
     */
    public List<SmsMessage> searchMessages(Long deviceId, String receiverPhone, String keyword, String phone,
                                          LocalDateTime startTime, LocalDateTime endTime, Long userId) {
        deviceService.getDevice(deviceId, userId);

        LambdaQueryWrapper<SmsMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SmsMessage::getDeviceId, deviceId);
        if (receiverPhone != null && !receiverPhone.isEmpty()) {
            if (UNKNOWN_RECEIVER.equals(receiverPhone)) {
                wrapper.and(w -> w.isNull(SmsMessage::getReceiverPhone).or().eq(SmsMessage::getReceiverPhone, ""));
            } else {
                wrapper.eq(SmsMessage::getReceiverPhone, receiverPhone);
            }
        }
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(SmsMessage::getContent, keyword);
        }
        if (phone != null && !phone.isEmpty()) {
            wrapper.eq(SmsMessage::getPhoneNumber, phone);
        }

        if (startTime != null) {
            wrapper.ge(SmsMessage::getCreatedAt, startTime);
        }

        if (endTime != null) {
            wrapper.le(SmsMessage::getCreatedAt, endTime);
        }

        wrapper.orderByDesc(SmsMessage::getCreatedAt);

        return smsMessageMapper.selectList(wrapper);
    }
}
