package com.finanzas.backend.user.dto;

import com.finanzas.backend.user.User;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    private String preferredCurrency;

    public static UserResponse from(User user) {
        UserResponse dto = new UserResponse();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.email = user.getEmail();
        dto.avatarUrl = user.getAvatarUrl();
        dto.preferredCurrency = user.getPreferredCurrency();
        return dto;
    }
}
