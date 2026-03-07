package com.smsserver.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    public static final String MESSAGES_TOPIC = "sms.webhook.messages";
    public static final String MISSED_CALLS_TOPIC = "sms.webhook.missedcalls";

    @Bean
    public NewTopic messagesTopic() {
        return TopicBuilder.name(MESSAGES_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic missedCallsTopic() {
        return TopicBuilder.name(MISSED_CALLS_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
