package com.finanzas.backend.notification;

import com.finanzas.backend.auth.CurrentUser;
import com.finanzas.backend.auth.UserPrincipal;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.notification.dto.CreateNotificationRequest;
import com.finanzas.backend.notification.dto.NotificationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> create(
            @Valid @RequestBody CreateNotificationRequest request,
            @CurrentUser UserPrincipal currentUser) {
        Notification notification = notificationService.create(
                currentUser.getId(),
                request.getType(),
                request.getMessage(),
                request.getReferenceId(),
                request.getReferenceType()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(NotificationResponse.from(notification));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getById(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        Notification notification = notificationService.getById(id);
        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés ver esta notificación");
        }
        return ResponseEntity.ok(NotificationResponse.from(notification));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getByUser(
            @PathVariable Long userId,
            @CurrentUser UserPrincipal currentUser) {
        if (!userId.equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés ver las notificaciones de otro usuario");
        }
        List<NotificationResponse> notifications = notificationService.getByUser(userId)
                .stream().map(NotificationResponse::from).toList();
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadByUser(
            @PathVariable Long userId,
            @CurrentUser UserPrincipal currentUser) {
        if (!userId.equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés ver las notificaciones de otro usuario");
        }
        List<NotificationResponse> notifications = notificationService.getUnreadByUser(userId)
                .stream().map(NotificationResponse::from).toList();
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/user/{userId}/unread/count")
    public ResponseEntity<Map<String, Long>> countUnread(
            @PathVariable Long userId,
            @CurrentUser UserPrincipal currentUser) {
        if (!userId.equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés ver las notificaciones de otro usuario");
        }
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(NotificationResponse.from(notificationService.markAsRead(id, currentUser.getId())));
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @PathVariable Long userId,
            @CurrentUser UserPrincipal currentUser) {
        if (!userId.equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés modificar las notificaciones de otro usuario");
        }
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }
}
