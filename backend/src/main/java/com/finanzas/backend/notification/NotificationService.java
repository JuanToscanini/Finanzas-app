package com.finanzas.backend.notification;

import com.finanzas.backend.user.User;
import com.finanzas.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    public Notification create(Long userId, String type, String message,
                               Long referenceId, String referenceType) {
        User user = userService.getById(userId);

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setMessage(message);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notification.setIsRead(false);

        return notificationRepository.save(notification);
    }

    public Notification getById(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada: " + notificationId));
    }

    public List<Notification> getByUser(Long userId) {
        User user = userService.getById(userId);
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Notification> getUnreadByUser(Long userId) {
        User user = userService.getById(userId);
        return notificationRepository.findByUserAndIsReadFalse(user);
    }

    public long countUnread(Long userId) {
        User user = userService.getById(userId);
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Transactional
    public Notification markAsRead(Long notificationId, Long userId) {
        Notification notification = getById(notificationId);

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("No tenés permiso para modificar esta notificación");
        }

        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        User user = userService.getById(userId);
        List<Notification> unread = notificationRepository.findByUserAndIsReadFalse(user);

        for (Notification notification : unread) {
            notification.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }
}
