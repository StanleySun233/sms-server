package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("devices")
public class Device {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String alias;

    private String webhookToken;

    private String currentPhoneNumber;

    private String imei;

    private Integer signalStrength;

    private LocalDateTime lastHeartbeatAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
