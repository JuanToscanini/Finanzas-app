package com.finanzas.backend.notification.dto;

import com.finanzas.backend.notification.Notification;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long id;
    private Long userId;
    private String type;
    private String message;
    private Boolean isRead;
    private Long referenceId;
    private String referenceType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NotificationResponse from(Notification notification) {
        NotificationResponse dto = new NotificationResponse();
        dto.id = notification.getId();
        dto.userId = notification.getUser().getId();
        dto.type = notification.getType();
        dto.message = notification.getMessage();
        dto.isRead = notification.getIsRead();
        dto.referenceId = notification.getReferenceId();
        dto.referenceType = notification.getReferenceType();
        dto.createdAt = notification.getCreatedAt();
        dto.updatedAt = notification.getUpdatedAt();
        return dto;
    }
}
