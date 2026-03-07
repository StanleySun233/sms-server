package com.smsserver.dto;

import lombok.Data;
import java.util.List;

@Data
public class DashboardStatsResponse {
    private int onlineDevices;
    private int warningDevices;
    private int offlineDevices;
    private int totalUnreadMessages;
    private int totalUnreadCalls;
    private int totalSentMessages;
    private List<DeviceStats> devices;

    @Data
    public static class DeviceStats {
        private Long id;
        private String alias;
        private String status;
        private int unreadMessages;
        private int unreadCalls;
        private String lastHeartbeatAt;
        private String currentPhoneNumber;
        private Integer signalStrength;
    }
}
