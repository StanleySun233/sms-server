package com.smsserver.dto.sms;

import lombok.Data;

@Data
public class RetryMessageRequest {
    private Long messageId;
}
