package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("webhook_log")
public class WebhookLog {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long deviceId;
    private String webhookToken;
    private LocalDateTime receivedAt;
    private Integer newMessagesCount;
    private Integer missedCallsCount;
    private Integer commandsCount;
    private BigDecimal latitude;
    private BigDecimal longitude;
}
