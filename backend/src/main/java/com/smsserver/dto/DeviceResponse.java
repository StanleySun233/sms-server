package com.smsserver.dto;

import com.smsserver.entity.Device;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Data
public class DeviceResponse {
    private Long id;
    private String alias;
    private String webhookToken;
    private String status;
    private String lastHeartbeatAt;
    private String currentPhoneNumber;
    private Integer signalStrength;
    private LocalDateTime createdAt;

    public static DeviceResponse fromEntity(Device device, String status) {
        DeviceResponse response = new DeviceResponse();
        response.setId(device.getId());
        response.setAlias(device.getAlias());
        response.setWebhookToken(device.getWebhookToken());
        response.setStatus(status);
        response.setLastHeartbeatAt(device.getLastHeartbeatAt() != null
                ? device.getLastHeartbeatAt().atZone(ZoneOffset.UTC).toInstant().toString()
                : null);
        response.setCurrentPhoneNumber(device.getCurrentPhoneNumber());
        response.setSignalStrength(device.getSignalStrength());
        response.setCreatedAt(device.getCreatedAt());
        return response;
    }
}
