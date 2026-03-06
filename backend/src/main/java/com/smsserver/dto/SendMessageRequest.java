package com.smsserver.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {
    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number too long")
    private String phone;

    @NotBlank(message = "Content is required")
    @Size(max = 1000, message = "Message content too long")
    private String content;
}
