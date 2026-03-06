package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("missed_call")
public class MissedCall {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long deviceId;
    private String phoneNumber;
    private LocalDateTime callTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    private LocalDateTime readAt;
}
