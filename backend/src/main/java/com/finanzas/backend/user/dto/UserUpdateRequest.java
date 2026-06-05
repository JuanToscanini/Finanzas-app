package com.finanzas.backend.user.dto;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String username;
    private String avatarUrl;
    private String preferredCurrency;
}
