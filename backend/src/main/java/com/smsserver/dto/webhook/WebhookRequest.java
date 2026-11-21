package com.smsserver.dto.webhook;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.Data;

import java.util.List;

@Data
public class WebhookRequest {
    private DeviceInfo deviceInfo;
    private Integer smsProtocol;
    private String deviceSession;
    private List<SmsResult> smsResults;
    @JsonDeserialize(using = ListOrEmptyObjectDeserializer.NewMessageListDeserializer.class)
    private List<NewMessage> newMessages;
    @JsonDeserialize(using = ListOrEmptyObjectDeserializer.MissedCallListDeserializer.class)
    private List<MissedCall> missedCalls;

    @Data
    public static class DeviceInfo {
        private String simId;
        private String phoneNumber;
        private String imei;
        private Integer signalStrength;
        private Integer batteryLevel;
        private Double latitude;
        private Double longitude;
    }

    @Data
    public static class SmsResult {
        private String attemptId;
        private String status;
    }

    @Data
    public static class NewMessage {
        private String eventId;
        private String receiverPhone;
        private String phone;
        private String content;
        private String timestamp;
    }

    @Data
    public static class MissedCall {
        private String eventId;
        private String phone;
        private String timestamp;
    }
}
