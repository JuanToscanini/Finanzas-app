package com.finanzas.backend.group.dto;

import com.finanzas.backend.group.Group;
import com.finanzas.backend.user.dto.UserResponse;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class GroupResponse {
    private Long id;
    private String name;
    private UserResponse createdBy;
    private Boolean isActive;
    private List<UserResponse> members;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GroupResponse from(Group group) {
        GroupResponse dto = new GroupResponse();
        dto.id = group.getId();
        dto.name = group.getName();
        dto.createdBy = group.getCreatedBy() != null ? UserResponse.from(group.getCreatedBy()) : null;
        dto.isActive = group.getIsActive();
        dto.members = group.getMembers() != null
                ? group.getMembers().stream().map(UserResponse::from).toList()
                : List.of();
        dto.createdAt = group.getCreatedAt();
        dto.updatedAt = group.getUpdatedAt();
        return dto;
    }
}
