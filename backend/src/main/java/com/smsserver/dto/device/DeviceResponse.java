package com.smsserver.dto.device;

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
    private String imei;
    private Integer signalStrength;
    private Double latitude;
    private Double longitude;
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
        response.setImei(device.getImei());
        response.setSignalStrength(device.getSignalStrength());
        response.setLatitude(device.getLatitude() != null ? device.getLatitude().doubleValue() : null);
        response.setLongitude(device.getLongitude() != null ? device.getLongitude().doubleValue() : null);
        response.setCreatedAt(device.getCreatedAt());
        return response;
    }
}
