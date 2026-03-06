package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sms_message")
public class SmsMessage {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long deviceId;
    private String receiverPhone;
    private String phoneNumber;
    private String content;
    private String direction; // "sent" or "received"
    private String status; // "pending", "sent", "delivered", "failed"

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private LocalDateTime readAt;
}
