package com.smsserver.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * DTO for missed call summary grouped by phone number
 */
@Data
@AllArgsConstructor
public class MissedCallSummary {
    private String phone;
    private Long count;
    private LocalDateTime lastCallTime;
}
