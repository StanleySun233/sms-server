package com.smsserver.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smsserver.dto.DashboardStatsResponse;
import com.smsserver.entity.Device;
import com.smsserver.entity.MissedCall;
import com.smsserver.entity.SmsMessage;
import com.smsserver.mapper.DeviceMapper;
import com.smsserver.mapper.MissedCallMapper;
import com.smsserver.mapper.SmsMessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {
    private final DeviceMapper deviceMapper;
    private final SmsMessageMapper smsMessageMapper;
    private final MissedCallMapper missedCallMapper;
    private final DeviceService deviceService;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Get comprehensive dashboard statistics for a user
     */
    public DashboardStatsResponse getDashboardStats(Long userId) {
        DashboardStatsResponse response = new DashboardStatsResponse();

        // Get all user devices
        LambdaQueryWrapper<Device> deviceWrapper = new LambdaQueryWrapper<>();
        deviceWrapper.eq(Device::getUserId, userId)
                    .orderByDesc(Device::getCreatedAt);
        List<Device> devices = deviceMapper.selectList(deviceWrapper);

        // Initialize counters
        int onlineCount = 0;
        int warningCount = 0;
        int offlineCount = 0;
        int totalUnreadMessages = 0;
        int totalUnreadCalls = 0;

        List<DashboardStatsResponse.DeviceStats> deviceStatsList = new ArrayList<>();

        // Process each device
        for (Device device : devices) {
            String status = deviceService.calculateDeviceStatus(device);

            // Count device status
            switch (status) {
                case "online":
                    onlineCount++;
                    break;
                case "warning":
                    warningCount++;
                    break;
                case "offline":
                    offlineCount++;
                    break;
            }

            // Count unread messages for this device
            LambdaQueryWrapper<SmsMessage> messageWrapper = new LambdaQueryWrapper<>();
            messageWrapper.eq(SmsMessage::getDeviceId, device.getId())
                         .isNull(SmsMessage::getReadAt);
            long unreadMessages = smsMessageMapper.selectCount(messageWrapper);
            totalUnreadMessages += unreadMessages;

            // Count unread missed calls for this device
            LambdaQueryWrapper<MissedCall> callWrapper = new LambdaQueryWrapper<>();
            callWrapper.eq(MissedCall::getDeviceId, device.getId())
                      .isNull(MissedCall::getReadAt);
            long unreadCalls = missedCallMapper.selectCount(callWrapper);
            totalUnreadCalls += unreadCalls;

            // Create device stats
            DashboardStatsResponse.DeviceStats stats = new DashboardStatsResponse.DeviceStats();
            stats.setId(device.getId());
            stats.setAlias(device.getAlias());
            stats.setStatus(status);
            stats.setUnreadMessages((int) unreadMessages);
            stats.setUnreadCalls((int) unreadCalls);
            stats.setLastHeartbeatAt(
                device.getLastHeartbeatAt() != null
                    ? device.getLastHeartbeatAt().format(FORMATTER)
                    : null
            );
            stats.setCurrentPhoneNumber(device.getCurrentPhoneNumber());

            deviceStatsList.add(stats);
        }

        // Set response data
        response.setOnlineDevices(onlineCount);
        response.setWarningDevices(warningCount);
        response.setOfflineDevices(offlineCount);
        response.setTotalUnreadMessages(totalUnreadMessages);
        response.setTotalUnreadCalls(totalUnreadCalls);
        response.setDevices(deviceStatsList);

        log.info("Dashboard stats for user {}: {} online, {} warning, {} offline, {} unread messages, {} unread calls",
                userId, onlineCount, warningCount, offlineCount, totalUnreadMessages, totalUnreadCalls);

        return response;
    }
}
