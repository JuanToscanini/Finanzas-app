package com.finanzas.backend.settlement;

import com.finanzas.backend.auth.UserPrincipal;
import com.finanzas.backend.common.GlobalExceptionHandler;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.settlement.dto.SettlementResponse;
import com.finanzas.backend.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Cubre la autorización agregada en el commit 49faa51 (X-User-Id -> JWT/@CurrentUser):
 * un usuario autenticado no puede leer los pagos (settlements) de otro usuario aunque
 * pase su id en el path.
 */
@ExtendWith(MockitoExtension.class)
class SettlementControllerTest {

    @Mock
    private SettlementService settlementService;

    @InjectMocks
    private SettlementController settlementController;

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
        assertThatThrownBy(() -> settlementController.getByUser(userB.getId(), principalA))
                .isInstanceOf(UnauthorizedException.class);

        verify(settlementService, never()).getByUser(any());
    }

    @Test
    void unauthorizedException_isMappedTo403ByGlobalHandler() {
        // Mismo patrón que usa el resto de la API para accesos cruzados: 403, no 404.
        UnauthorizedException ex = new UnauthorizedException("No podés ver los pagos de otro usuario");
        ResponseEntity<?> response = new GlobalExceptionHandler().handleUnauthorized(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getByUser_withOwnIdInPath_returnsOwnSettlements() {
        Settlement settlement = settlement(50L, userB, userA, "100.00");
        when(settlementService.getByUser(userA.getId())).thenReturn(List.of(settlement));

        ResponseEntity<List<SettlementResponse>> response =
                settlementController.getByUser(userA.getId(), principalA);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getId()).isEqualTo(50L);
    }

    // --- helpers ---

    private static User user(Long id, String username) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setEmail(username + "@test.com");
        return u;
    }

    private static Settlement settlement(Long id, User paidBy, User paidTo, String amount) {
        Settlement s = new Settlement();
        s.setId(id);
        s.setPaidBy(paidBy);
        s.setPaidTo(paidTo);
        s.setAmount(new BigDecimal(amount));
        s.setCurrency("UYU");
        s.setStatus(Settlement.Status.PENDING);
        return s;
    }
}
