package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
    private String status;
    private String attemptId;
    @JsonIgnore
    private String attemptOwner;
    private Integer attemptOfferCount;
    private Integer attemptCount;
    private String requestId;
    private LocalDateTime attemptExpiresAt;
    @JsonIgnore
    private String expectedSim;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
