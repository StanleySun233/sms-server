package com.smsserver.dto.device;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class TransferDeviceRequest {
    @NotBlank(message = "Username is required")
    private String username;
}
