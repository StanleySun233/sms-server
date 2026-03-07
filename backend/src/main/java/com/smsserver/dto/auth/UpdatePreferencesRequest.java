package com.smsserver.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdatePreferencesRequest {
    @NotBlank(message = "locale is required")
    private String locale;
}
