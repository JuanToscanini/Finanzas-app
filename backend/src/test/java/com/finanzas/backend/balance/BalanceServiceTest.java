package com.finanzas.backend.balance;

import com.finanzas.backend.balance.dto.GroupBalanceResponse;
import com.finanzas.backend.balance.dto.SettlementSuggestionResponse;
import com.finanzas.backend.balance.dto.UserBalanceResponse;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.expense.Expense;
import com.finanzas.backend.expense.ExpenseRepository;
import com.finanzas.backend.group.Group;
import com.finanzas.backend.group.GroupService;
import com.finanzas.backend.settlement.Settlement;
import com.finanzas.backend.settlement.SettlementRepository;
import com.finanzas.backend.split.Split;
import com.finanzas.backend.split.SplitRepository;
import com.finanzas.backend.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BalanceServiceTest {

    @Mock private GroupService groupService;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private SplitRepository splitRepository;
    @Mock private SettlementRepository settlementRepository;

    @InjectMocks
    private BalanceService balanceService;

    private User alice;
    private User bob;
    private User carol;
    private Group group;

    @BeforeEach
    void setUp() {
        alice = user(1L, "alice");
        bob = user(2L, "bob");
        carol = user(3L, "carol");

        group = new Group();
        group.setId(10L);
        group.setName("Viaje");
        group.setMembers(List.of(alice, bob));

        when(groupService.getById(10L)).thenReturn(group);
    }

    @Test
    void twoUsers_equalSplit_generatesSingleSuggestion() {
        Expense expense = expense(1L, alice, group, "100.00");
        Split splitAlice = split(expense, alice, "50.00");
        Split splitBob = split(expense, bob, "50.00");

        when(expenseRepository.findByGroup(group)).thenReturn(List.of(expense));
        when(splitRepository.findByExpense_Group(group)).thenReturn(List.of(splitAlice, splitBob));
        when(settlementRepository.findByGroupAndStatus(group, Settlement.Status.CONFIRMED)).thenReturn(List.of());

        GroupBalanceResponse response = balanceService.calculateGroupBalance(10L, 1L);

        assertThat(response.getBalances())
                .extracting(UserBalanceResponse::getUserId, UserBalanceResponse::getNetBalance)
                .containsExactlyInAnyOrder(
                        tuple(1L, new BigDecimal("50.00")),
                        tuple(2L, new BigDecimal("-50.00"))
                );

        assertThat(response.getSuggestedSettlements()).hasSize(1);
        SettlementSuggestionResponse suggestion = response.getSuggestedSettlements().get(0);
        assertThat(suggestion.getFromUserId()).isEqualTo(2L);
        assertThat(suggestion.getToUserId()).isEqualTo(1L);
        assertThat(suggestion.getAmount()).isEqualByComparingTo("50.00");
    }

    @Test
    void threeUsers_oneExpense_minimizesTransactions() {
        group.setMembers(List.of(alice, bob, carol));

        Expense expense = expense(2L, alice, group, "90.00");
        Split sAlice = split(expense, alice, "30.00");
        Split sBob = split(expense, bob, "30.00");
        Split sCarol = split(expense, carol, "30.00");

        when(expenseRepository.findByGroup(group)).thenReturn(List.of(expense));
        when(splitRepository.findByExpense_Group(group)).thenReturn(List.of(sAlice, sBob, sCarol));
        when(settlementRepository.findByGroupAndStatus(group, Settlement.Status.CONFIRMED)).thenReturn(List.of());

        GroupBalanceResponse response = balanceService.calculateGroupBalance(10L, 1L);

        // Nunca deberían hacer falta más transacciones que (miembros - 1)
        assertThat(response.getSuggestedSettlements()).hasSize(2);
        assertThat(response.getSuggestedSettlements()).allMatch(s -> s.getToUserId().equals(1L));
        assertThat(response.getSuggestedSettlements().stream()
                .map(SettlementSuggestionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo("60.00");
    }

    @Test
    void confirmedSettlement_reducesOutstandingDebt() {
        Expense expense = expense(3L, alice, group, "100.00");
        Split splitAlice = split(expense, alice, "50.00");
        Split splitBob = split(expense, bob, "50.00");

        Settlement settlement = new Settlement();
        settlement.setGroup(group);
        settlement.setPaidBy(bob);
        settlement.setPaidTo(alice);
        settlement.setAmount(new BigDecimal("20.00"));
        settlement.setStatus(Settlement.Status.CONFIRMED);

        when(expenseRepository.findByGroup(group)).thenReturn(List.of(expense));
        when(splitRepository.findByExpense_Group(group)).thenReturn(List.of(splitAlice, splitBob));
        when(settlementRepository.findByGroupAndStatus(group, Settlement.Status.CONFIRMED)).thenReturn(List.of(settlement));

        GroupBalanceResponse response = balanceService.calculateGroupBalance(10L, 1L);

        // Bob debía 50, ya pagó 20 confirmado -> quedan 30
        assertThat(response.getSuggestedSettlements()).hasSize(1);
        assertThat(response.getSuggestedSettlements().get(0).getAmount()).isEqualByComparingTo("30.00");
    }

    @Test
    void onlyConfirmedSettlementsAreQueried_pendingAndRejectedAreIgnoredByTheRepositoryFilter() {
        Expense expense = expense(4L, alice, group, "100.00");
        Split splitAlice = split(expense, alice, "50.00");
        Split splitBob = split(expense, bob, "50.00");

        when(expenseRepository.findByGroup(group)).thenReturn(List.of(expense));
        when(splitRepository.findByExpense_Group(group)).thenReturn(List.of(splitAlice, splitBob));
        when(settlementRepository.findByGroupAndStatus(group, Settlement.Status.CONFIRMED)).thenReturn(List.of());

        balanceService.calculateGroupBalance(10L, 1L);

        verify(settlementRepository).findByGroupAndStatus(group, Settlement.Status.CONFIRMED);
        verify(settlementRepository, never()).findByGroup(group);
    }

    @Test
    void noExpenses_allBalancesZero_noSuggestions() {
        when(expenseRepository.findByGroup(group)).thenReturn(List.of());
        when(splitRepository.findByExpense_Group(group)).thenReturn(List.of());
        when(settlementRepository.findByGroupAndStatus(group, Settlement.Status.CONFIRMED)).thenReturn(List.of());

        GroupBalanceResponse response = balanceService.calculateGroupBalance(10L, 1L);

        assertThat(response.getBalances())
                .extracting(UserBalanceResponse::getNetBalance)
                .allMatch(balance -> balance.compareTo(BigDecimal.ZERO) == 0);
        assertThat(response.getSuggestedSettlements()).isEmpty();
    }

    @Test
    void requesterNotMember_throwsUnauthorized() {
        assertThatThrownBy(() -> balanceService.calculateGroupBalance(10L, 999L))
                .isInstanceOf(UnauthorizedException.class);
    }

    // --- helpers ---

    private static User user(Long id, String username) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setEmail(username + "@test.com");
        return u;
    }

    private static Expense expense(Long id, User paidBy, Group group, String amount) {
        Expense e = new Expense();
        e.setId(id);
        e.setPaidBy(paidBy);
        e.setGroup(group);
        e.setAmount(new BigDecimal(amount));
        e.setDescription("gasto de prueba");
        e.setSplitType(Expense.SplitType.EQUAL);
        return e;
    }

    private static Split split(Expense expense, User user, String amount) {
        Split s = new Split();
        s.setExpense(expense);
        s.setUser(user);
        s.setAmount(new BigDecimal(amount));
        s.setIsSettled(false);
        return s;
    }
}
