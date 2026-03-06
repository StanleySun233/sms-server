package com.smsserver.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LineSummaryResponse {
    private String receiverPhone;
    private String lastMessage;
    private Integer unreadCount;
    private LocalDateTime lastMessageTime;
}
