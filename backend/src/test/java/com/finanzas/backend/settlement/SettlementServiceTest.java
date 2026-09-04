package com.finanzas.backend.settlement;

import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.common.exception.ValidationException;
import com.finanzas.backend.group.Group;
import com.finanzas.backend.group.GroupService;
import com.finanzas.backend.notification.NotificationService;
import com.finanzas.backend.user.FriendshipService;
import com.finanzas.backend.user.User;
import com.finanzas.backend.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Cubre el nuevo flujo de "pago suelto" (settlement sin groupId): cuando groupId es null,
 * el service debe validar amistad ACCEPTED entre paidBy y paidTo en lugar de membresía de grupo.
 */
@ExtendWith(MockitoExtension.class)
class SettlementServiceTest {

    @Mock
    private SettlementRepository settlementRepository;
    @Mock
    private GroupService groupService;
    @Mock
    private UserService userService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private FriendshipService friendshipService;

    private SettlementService settlementService;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        settlementService = new SettlementService(
                settlementRepository, groupService, userService, notificationService, friendshipService);
        alice = user(1L, "alice");
        bob = user(2L, "bob");
    }

    @Test
    void createSettlement_withoutGroupId_andFriends_createsSettlementWithNullGroup() {
        when(userService.getById(alice.getId())).thenReturn(alice);
        when(userService.getById(bob.getId())).thenReturn(bob);
        when(friendshipService.areFriends(alice.getId(), bob.getId())).thenReturn(true);
        when(settlementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Settlement result = settlementService.createSettlement(
                null, alice.getId(), bob.getId(), new BigDecimal("100.00"), "UYU", null);

        assertThat(result.getGroup()).isNull();
        verify(groupService, never()).getById(any());

        ArgumentCaptor<Settlement> captor = ArgumentCaptor.forClass(Settlement.class);
        verify(settlementRepository).save(captor.capture());
        assertThat(captor.getValue().getGroup()).isNull();
    }

    @Test
    void createSettlement_withoutGroupId_andNotFriends_throwsUnauthorized() {
        when(userService.getById(alice.getId())).thenReturn(alice);
        when(userService.getById(bob.getId())).thenReturn(bob);
        when(friendshipService.areFriends(alice.getId(), bob.getId())).thenReturn(false);

        assertThatThrownBy(() -> settlementService.createSettlement(
                null, alice.getId(), bob.getId(), new BigDecimal("100.00"), "UYU", null))
                .isInstanceOf(UnauthorizedException.class);

        verify(settlementRepository, never()).save(any());
    }

    @Test
    void createSettlement_withGroupId_stillValidatesGroupMembershipNotFriendship() {
        when(userService.getById(alice.getId())).thenReturn(alice);
        when(userService.getById(bob.getId())).thenReturn(bob);
        Group group = new Group();
        group.setId(10L);
        group.setMembers(List.of(alice, bob));
        when(groupService.getById(group.getId())).thenReturn(group);
        when(settlementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Settlement result = settlementService.createSettlement(
                group.getId(), alice.getId(), bob.getId(), new BigDecimal("50.00"), "UYU", null);

        assertThat(result.getGroup()).isEqualTo(group);
        verify(friendshipService, never()).areFriends(any(), any());
    }

    @Test
    void createSettlement_withGroupId_andUserNotMember_throwsUnauthorized() {
        when(userService.getById(alice.getId())).thenReturn(alice);
        when(userService.getById(bob.getId())).thenReturn(bob);
        Group group = new Group();
        group.setId(10L);
        group.setMembers(List.of(alice));
        when(groupService.getById(group.getId())).thenReturn(group);

        assertThatThrownBy(() -> settlementService.createSettlement(
                group.getId(), alice.getId(), bob.getId(), new BigDecimal("50.00"), "UYU", null))
                .isInstanceOf(UnauthorizedException.class);

        verify(settlementRepository, never()).save(any());
    }

    @Test
    void createSettlement_payingSelf_throwsValidationException_regardlessOfGroup() {
        assertThatThrownBy(() -> settlementService.createSettlement(
                null, alice.getId(), alice.getId(), new BigDecimal("50.00"), "UYU", null))
                .isInstanceOf(ValidationException.class);

        verify(friendshipService, never()).areFriends(any(), any());
        verify(settlementRepository, never()).save(any());
    }

    private static User user(Long id, String username) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setEmail(username + "@test.com");
        return u;
    }
}
