package com.smsserver.dto.sms;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConversationResponse {
    private String phone;
    private String lastMessage;
    private String lastMessageDirection;
    private Integer unreadCount;
    private LocalDateTime lastMessageTime;
}
