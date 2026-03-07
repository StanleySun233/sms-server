package com.smsserver.dto.missedcall;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class MissedCallSummary {
    private String phone;
    private Long count;
    private LocalDateTime lastCallTime;
}
