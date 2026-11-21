package com.smsserver.service;

import com.smsserver.dto.dashboard.DashboardStatsResponse;
import com.smsserver.dto.dashboard.DeviceOverview;
import com.smsserver.mapper.DeviceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {
    private final DeviceMapper deviceMapper;
    private final DeviceService deviceService;

    /**
     * Get comprehensive dashboard statistics for a user
     */
    public DashboardStatsResponse getDashboardStats(Long userId) {
        DashboardStatsResponse response = new DashboardStatsResponse();

        List<DeviceOverview> devices = deviceMapper.findDashboardDevices(userId);

        int onlineCount = 0;
        int warningCount = 0;
        int offlineCount = 0;
        int totalUnreadMessages = 0;
        int totalUnreadCalls = 0;
        int totalSentMessages = 0;

        List<DashboardStatsResponse.DeviceStats> deviceStatsList = new ArrayList<>();

        // Process each device
        for (DeviceOverview device : devices) {
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

            totalUnreadMessages += device.getUnreadMessages();
            totalUnreadCalls += device.getUnreadCalls();
            totalSentMessages += device.getOutgoingTasks();

            // Create device stats
            DashboardStatsResponse.DeviceStats stats = new DashboardStatsResponse.DeviceStats();
            stats.setId(device.getId());
            stats.setAlias(device.getAlias());
            stats.setStatus(status);
            stats.setUnreadMessages(device.getUnreadMessages());
            stats.setUnreadCalls(device.getUnreadCalls());
            stats.setLastHeartbeatAt(
                device.getLastHeartbeatAt() != null
                    ? device.getLastHeartbeatAt().atZone(ZoneOffset.UTC).toInstant().toString()
                    : null
            );
            stats.setCurrentPhoneNumber(device.getCurrentPhoneNumber());
            stats.setImei(device.getImei());
            stats.setSignalStrength(device.getSignalStrength());

            deviceStatsList.add(stats);
        }

        response.setOnlineDevices(onlineCount);
        response.setWarningDevices(warningCount);
        response.setOfflineDevices(offlineCount);
        response.setTotalUnreadMessages(totalUnreadMessages);
        response.setTotalUnreadCalls(totalUnreadCalls);
        response.setTotalSentMessages(totalSentMessages);
        response.setDevices(deviceStatsList);

        log.debug("Dashboard stats for user {}: {} online, {} warning, {} offline, {} unread messages, {} unread calls",
                userId, onlineCount, warningCount, offlineCount, totalUnreadMessages, totalUnreadCalls);

        return response;
    }
}
