package com.smsserver.dto.missedcall;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MissedCallSummary {
    private String phone;
    private Long count;
    private LocalDateTime lastCallTime;
}
