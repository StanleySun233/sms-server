package com.smsserver.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ConversationResponse {
    private String phone;
    private String lastMessage;
    private Integer unreadCount;
    private LocalDateTime lastMessageTime;
}
