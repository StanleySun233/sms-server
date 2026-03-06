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
