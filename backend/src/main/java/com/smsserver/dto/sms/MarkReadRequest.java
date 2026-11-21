package com.smsserver.dto.sms;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class MarkReadRequest {
    @NotEmpty(message = "Message IDs are required")
    @Size(max = 200, message = "Mark at most 200 messages at a time")
    private List<@NotNull @Positive Long> messageIds;
}
