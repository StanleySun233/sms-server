package com.smsserver.dto.device;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class CreateDeviceRequest {
    @NotBlank(message = "Alias is required")
    @Size(min = 1, max = 100, message = "Alias must be between 1 and 100 characters")
    private String alias;
}
