package com.finanzas.backend.notification;

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
            @RequestHeader("X-User-Id") Long userId) {
        Notification notification = notificationService.create(
                userId,
                request.getType(),
                request.getMessage(),
                request.getReferenceId(),
                request.getReferenceType()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(NotificationResponse.from(notification));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(NotificationResponse.from(notificationService.getById(id)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getByUser(@PathVariable Long userId) {
        List<NotificationResponse> notifications = notificationService.getByUser(userId)
                .stream().map(NotificationResponse::from).toList();
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadByUser(@PathVariable Long userId) {
        List<NotificationResponse> notifications = notificationService.getUnreadByUser(userId)
                .stream().map(NotificationResponse::from).toList();
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/user/{userId}/unread/count")
    public ResponseEntity<Map<String, Long>> countUnread(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(NotificationResponse.from(notificationService.markAsRead(id, userId)));
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }
}
