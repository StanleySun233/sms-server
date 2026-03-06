package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smsserver.dto.ConversationResponse;
import com.smsserver.dto.LineSummaryResponse;
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

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
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
                .isNull(SmsMessage::getReceiverPhone)
                .orderByDesc(SmsMessage::getCreatedAt)
                .last("LIMIT 1");
        SmsMessage unknownLast = smsMessageMapper.selectOne(nullReceiverWrapper);
        if (unknownLast != null) {
            LineSummaryResponse unknownSummary = new LineSummaryResponse();
            unknownSummary.setReceiverPhone(UNKNOWN_RECEIVER);
            unknownSummary.setLastMessage(unknownLast.getContent());
            unknownSummary.setLastMessageTime(unknownLast.getCreatedAt());
            LambdaQueryWrapper<SmsMessage> unreadWrapper = new LambdaQueryWrapper<>();
            unreadWrapper.eq(SmsMessage::getDeviceId, deviceId)
                    .isNull(SmsMessage::getReceiverPhone)
                    .eq(SmsMessage::getDirection, "received")
                    .isNull(SmsMessage::getReadAt);
            unknownSummary.setUnreadCount(smsMessageMapper.selectCount(unreadWrapper).intValue());
            result.add(unknownSummary);
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

        LambdaQueryWrapper<SmsMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SmsMessage::getDeviceId, deviceId).orderByDesc(SmsMessage::getCreatedAt);
        if (receiverPhone != null && !receiverPhone.isEmpty()) {
            if (UNKNOWN_RECEIVER.equals(receiverPhone)) {
                wrapper.isNull(SmsMessage::getReceiverPhone);
            } else {
                wrapper.eq(SmsMessage::getReceiverPhone, receiverPhone);
            }
        }
        List<SmsMessage> allMessages = smsMessageMapper.selectList(wrapper);

        Map<String, List<SmsMessage>> groupedMessages = allMessages.stream()
                .collect(Collectors.groupingBy(SmsMessage::getPhoneNumber));

        List<ConversationResponse> conversations = new ArrayList<>();
        for (Map.Entry<String, List<SmsMessage>> entry : groupedMessages.entrySet()) {
            String phone = entry.getKey();
            List<SmsMessage> messages = entry.getValue();
            SmsMessage lastMessage = messages.get(0);
            long unreadCount = messages.stream()
                    .filter(m -> "received".equals(m.getDirection()) && m.getReadAt() == null)
                    .count();
            ConversationResponse conversation = new ConversationResponse();
            conversation.setPhone(phone);
            conversation.setLastMessage(lastMessage.getContent());
            conversation.setUnreadCount((int) unreadCount);
            conversation.setLastMessageTime(lastMessage.getCreatedAt());
            conversations.add(conversation);
        }
        conversations.sort((a, b) -> b.getLastMessageTime().compareTo(a.getLastMessageTime()));
        return conversations;
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
                .orderByDesc(SmsMessage::getCreatedAt);
        if (receiverPhone != null && !receiverPhone.isEmpty()) {
            if (UNKNOWN_RECEIVER.equals(receiverPhone)) {
                wrapper.isNull(SmsMessage::getReceiverPhone);
            } else {
                wrapper.eq(SmsMessage::getReceiverPhone, receiverPhone);
            }
        }
        return smsMessageMapper.selectPage(page, wrapper);
    }

    /**
     * Send an SMS message
     * Creates a pending_sms record and pushes to Redis queue
     */
    @Transactional
    public PendingSms sendMessage(Long deviceId, String phone, String content, Long userId) {
        // Verify device ownership
        Device device = deviceService.getDevice(deviceId, userId);

        // Create pending SMS record
        PendingSms pendingSms = new PendingSms();
        pendingSms.setDeviceId(deviceId);
        pendingSms.setPhoneNumber(phone);
        pendingSms.setContent(content);
        pendingSms.setStatus("pending");
        pendingSmsMapper.insert(pendingSms);

        // Push to Redis queue
        redisService.pushPendingSmsTask(deviceId, pendingSms.getId());

        log.info("Created pending SMS {} for device {} to {}", pendingSms.getId(), deviceId, phone);
        return pendingSms;
    }

    public List<PendingSms> getSendLogs(Long deviceId, Long userId, int limit) {
        deviceService.getDevice(deviceId, userId);
        LambdaQueryWrapper<PendingSms> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PendingSms::getDeviceId, deviceId)
                .orderByDesc(PendingSms::getCreatedAt)
                .last("LIMIT " + Math.min(limit, 100));
        return pendingSmsMapper.selectList(wrapper);
    }

    /**
     * Mark messages as read (batch update)
     */
    @Transactional
    public void markMessagesAsRead(List<Long> messageIds, Long userId) {
        if (messageIds == null || messageIds.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        for (Long messageId : messageIds) {
            SmsMessage message = smsMessageMapper.selectById(messageId);
            if (message != null) {
                // Verify device ownership
                deviceService.getDevice(message.getDeviceId(), userId);

                // Update read_at if not already read
                if (message.getReadAt() == null) {
                    message.setReadAt(now);
                    smsMessageMapper.updateById(message);

                    // Invalidate unread count cache
                    redisService.deleteDeviceUnreadCount(message.getDeviceId());
                }
            }
        }

        log.info("Marked {} messages as read", messageIds.size());
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
                wrapper.isNull(SmsMessage::getReceiverPhone);
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

    /**
     * Export messages to CSV format
     */
    public byte[] exportMessages(Long deviceId, String receiverPhone, String phone, String format, Long userId) {
        deviceService.getDevice(deviceId, userId);
        LambdaQueryWrapper<SmsMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SmsMessage::getDeviceId, deviceId);
        if (receiverPhone != null && !receiverPhone.isEmpty()) {
            if (UNKNOWN_RECEIVER.equals(receiverPhone)) {
                wrapper.isNull(SmsMessage::getReceiverPhone);
            } else {
                wrapper.eq(SmsMessage::getReceiverPhone, receiverPhone);
            }
        }
        if (phone != null && !phone.isEmpty()) {
            wrapper.eq(SmsMessage::getPhoneNumber, phone);
        }
        wrapper.orderByDesc(SmsMessage::getCreatedAt);
        List<SmsMessage> messages = smsMessageMapper.selectList(wrapper);

        // Generate CSV
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             OutputStreamWriter osw = new OutputStreamWriter(baos, StandardCharsets.UTF_8);
             PrintWriter writer = new PrintWriter(osw)) {

            // Write BOM for Excel compatibility
            baos.write(0xEF);
            baos.write(0xBB);
            baos.write(0xBF);

            // Write header
            writer.println("ID,Phone Number,Content,Direction,Status,Created At,Read At");

            // Write data
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (SmsMessage message : messages) {
                writer.printf("%d,%s,\"%s\",%s,%s,%s,%s%n",
                        message.getId(),
                        message.getPhoneNumber(),
                        message.getContent().replace("\"", "\"\""), // Escape quotes
                        message.getDirection(),
                        message.getStatus(),
                        message.getCreatedAt().format(formatter),
                        message.getReadAt() != null ? message.getReadAt().format(formatter) : ""
                );
            }

            writer.flush();
            log.info("Exported {} messages for device {}", messages.size(), deviceId);
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to export messages", e);
            throw new RuntimeException("Failed to export messages: " + e.getMessage());
        }
    }
}
