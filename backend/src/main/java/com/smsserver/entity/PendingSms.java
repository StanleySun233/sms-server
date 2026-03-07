package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("pending_sms")
public class PendingSms {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long deviceId;
    private String phoneNumber;
    private String content;
    private String status; // "pending", "sent", "delivered", "failed"
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
