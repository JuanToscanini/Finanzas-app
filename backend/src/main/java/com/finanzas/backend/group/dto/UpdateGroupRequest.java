package com.finanzas.backend.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateGroupRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255)
    private String name;
}
