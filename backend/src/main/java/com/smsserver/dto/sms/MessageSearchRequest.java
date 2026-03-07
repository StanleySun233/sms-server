package com.smsserver.dto.sms;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageSearchRequest {
    private String keyword;
    private String phone;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
