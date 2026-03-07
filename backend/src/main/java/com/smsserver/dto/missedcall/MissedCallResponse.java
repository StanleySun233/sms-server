package com.smsserver.dto.missedcall;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MissedCallResponse {
    private Long id;
    private String phone;
    private LocalDateTime callTime;
    private LocalDateTime readAt;
}
