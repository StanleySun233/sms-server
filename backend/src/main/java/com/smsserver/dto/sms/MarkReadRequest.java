package com.smsserver.dto.sms;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class MarkReadRequest {
    @NotEmpty(message = "Message IDs are required")
    private List<Long> messageIds;
}
