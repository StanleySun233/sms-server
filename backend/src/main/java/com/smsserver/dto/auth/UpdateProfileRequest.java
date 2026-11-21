package com.smsserver.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must be at most 100 characters")
    private String email;
}
