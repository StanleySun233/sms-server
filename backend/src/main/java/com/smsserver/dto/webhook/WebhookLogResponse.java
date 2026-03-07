package com.smsserver.dto.webhook;

import com.smsserver.entity.WebhookLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebhookLogResponse {
    private Long id;
    private Long deviceId;
    private String webhookToken;
    private LocalDateTime receivedAt;
    private Integer newMessagesCount;
    private Integer missedCallsCount;
    private Integer commandsCount;
    private BigDecimal latitude;
    private BigDecimal longitude;

    public static WebhookLogResponse fromEntity(WebhookLog e) {
        if (e == null) return null;
        WebhookLogResponse r = new WebhookLogResponse();
        r.setId(e.getId());
        r.setDeviceId(e.getDeviceId());
        r.setWebhookToken(e.getWebhookToken());
        r.setReceivedAt(e.getReceivedAt());
        r.setNewMessagesCount(e.getNewMessagesCount());
        r.setMissedCallsCount(e.getMissedCallsCount());
        r.setCommandsCount(e.getCommandsCount());
        r.setLatitude(e.getLatitude());
        r.setLongitude(e.getLongitude());
        return r;
    }
}
