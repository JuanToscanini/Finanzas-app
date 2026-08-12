package com.finanzas.backend.user.dto;

import com.finanzas.backend.user.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    private String preferredCurrency;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        UserResponse dto = new UserResponse();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.email = user.getEmail();
        dto.avatarUrl = user.getAvatarUrl();
        dto.preferredCurrency = user.getPreferredCurrency();
        dto.createdAt = user.getCreatedAt();
        return dto;
    }
}
