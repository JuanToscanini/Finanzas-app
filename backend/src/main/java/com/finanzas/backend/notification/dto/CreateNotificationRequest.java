package com.finanzas.backend.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateNotificationRequest {

    @NotBlank
    private String type;

    @NotBlank
    private String message;

    private Long referenceId;
    private String referenceType;
}
