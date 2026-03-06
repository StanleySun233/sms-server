package com.smsserver.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * DTO for individual missed call record
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MissedCallResponse {
    private Long id;
    private String phone;
    private LocalDateTime callTime;
    private LocalDateTime readAt;
}
