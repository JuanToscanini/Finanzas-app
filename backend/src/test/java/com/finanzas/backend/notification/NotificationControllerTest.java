package com.finanzas.backend.notification;

import com.finanzas.backend.auth.UserPrincipal;
import com.finanzas.backend.common.GlobalExceptionHandler;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.notification.dto.NotificationResponse;
import com.finanzas.backend.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Cubre la autorización agregada en el commit 49faa51 (X-User-Id -> JWT/@CurrentUser):
 * un usuario autenticado no puede leer las notificaciones de otro usuario aunque
 * pase su id en el path.
 */
@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private User userA;
    private User userB;
    private UserPrincipal principalA;

    @BeforeEach
    void setUp() {
        userA = user(1L, "alice");
        userB = user(2L, "bob");
        principalA = UserPrincipal.from(userA);
    }

    @Test
    void getByUser_withAnotherUsersIdInPath_throwsUnauthorized() {
        assertThatThrownBy(() -> notificationController.getByUser(userB.getId(), principalA))
                .isInstanceOf(UnauthorizedException.class);

        verify(notificationService, never()).getByUser(any());
    }

    @Test
    void unauthorizedException_isMappedTo403ByGlobalHandler() {
        // Mismo patrón que usa el resto de la API para accesos cruzados: 403, no 404.
        UnauthorizedException ex = new UnauthorizedException("No podés ver las notificaciones de otro usuario");
        ResponseEntity<?> response = new GlobalExceptionHandler().handleUnauthorized(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getByUser_withOwnIdInPath_returnsOwnNotifications() {
        Notification notification = notification(100L, userA, "Tenés un gasto nuevo en Viaje");
        when(notificationService.getByUser(userA.getId())).thenReturn(List.of(notification));

        ResponseEntity<List<NotificationResponse>> response =
                notificationController.getByUser(userA.getId(), principalA);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getId()).isEqualTo(100L);
    }

    // --- helpers ---

    private static User user(Long id, String username) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setEmail(username + "@test.com");
        return u;
    }

    private static Notification notification(Long id, User owner, String message) {
        Notification n = new Notification();
        n.setId(id);
        n.setUser(owner);
        n.setType("EXPENSE_ADDED");
        n.setMessage(message);
        n.setIsRead(false);
        return n;
    }
}
