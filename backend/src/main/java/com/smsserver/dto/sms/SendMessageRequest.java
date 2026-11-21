package com.smsserver.dto.sms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {
    @Pattern(regexp = "[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}")
    private String requestId;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number too long")
    @Pattern(regexp = "\\+?[0-9]{5,19}", message = "Enter 5 to 19 digits with an optional leading +")
    private String phone;

    @NotBlank(message = "Content is required")
    @Size(max = 1000, message = "Message content too long")
    private String content;
}
