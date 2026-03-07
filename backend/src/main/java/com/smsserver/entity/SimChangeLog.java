package com.smsserver.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sim_change_log")
public class SimChangeLog {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long deviceId;
    private String oldPhoneNumber;
    private String newPhoneNumber;
    private LocalDateTime changedAt;
}
