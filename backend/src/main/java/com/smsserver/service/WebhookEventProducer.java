package com.smsserver.service;

import com.smsserver.config.KafkaConfig;
import com.smsserver.dto.WebhookMessageEvent;
import com.smsserver.dto.WebhookMissedCallEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishMessages(WebhookMessageEvent event) {
        log.info("Publishing {} messages for device {}", event.getMessages().size(), event.getDeviceId());
        kafkaTemplate.send(KafkaConfig.MESSAGES_TOPIC, event.getDeviceId().toString(), event);
    }

    public void publishMissedCalls(WebhookMissedCallEvent event) {
        log.info("Publishing {} missed calls for device {}", event.getMissedCalls().size(), event.getDeviceId());
        kafkaTemplate.send(KafkaConfig.MISSED_CALLS_TOPIC, event.getDeviceId().toString(), event);
    }
}
