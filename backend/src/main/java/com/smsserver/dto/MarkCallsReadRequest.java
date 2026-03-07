package com.smsserver.dto;

import lombok.Data;
import java.util.List;

/**
 * Request DTO for marking calls as read
 */
@Data
public class MarkCallsReadRequest {
    private List<Long> callIds;
}
