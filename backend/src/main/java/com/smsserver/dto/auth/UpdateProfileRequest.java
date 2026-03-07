package com.smsserver.dto.auth;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Email(message = "Email must be valid")
    private String email;
}
