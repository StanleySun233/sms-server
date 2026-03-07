package com.smsserver.service;

import com.smsserver.config.KafkaConfig;
import com.smsserver.dto.WebhookMessageEvent;
import com.smsserver.dto.WebhookMissedCallEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookEventConsumer {

    private final WebhookService webhookService;
    private final RedisService redisService;

    @KafkaListener(topics = KafkaConfig.MESSAGES_TOPIC, groupId = "sms-server")
    public void handleMessages(WebhookMessageEvent event) {
        try {
            log.info("Consuming {} messages for device {}", event.getMessages().size(), event.getDeviceId());
            webhookService.saveNewMessages(event.getDeviceId(), event.getMessages());
            redisService.deleteDeviceUnreadCount(event.getDeviceId());
            log.info("Successfully saved {} messages for device {}", event.getMessages().size(), event.getDeviceId());
        } catch (Exception e) {
            log.error("Failed to process messages for device {}: {}", event.getDeviceId(), e.getMessage(), e);
        }
    }

    @KafkaListener(topics = KafkaConfig.MISSED_CALLS_TOPIC, groupId = "sms-server")
    public void handleMissedCalls(WebhookMissedCallEvent event) {
        try {
            log.info("Consuming {} missed calls for device {}", event.getMissedCalls().size(), event.getDeviceId());
            webhookService.saveMissedCalls(event.getDeviceId(), event.getMissedCalls());
            log.info("Successfully saved {} missed calls for device {}", event.getMissedCalls().size(), event.getDeviceId());
        } catch (Exception e) {
            log.error("Failed to process missed calls for device {}: {}", event.getDeviceId(), e.getMessage(), e);
        }
    }
}
