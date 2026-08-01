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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BalanceService {

    private final GroupService groupService;
    private final ExpenseRepository expenseRepository;
    private final SplitRepository splitRepository;
    private final SettlementRepository settlementRepository;

    public GroupBalanceResponse calculateGroupBalance(Long groupId, Long requesterId) {
        Group group = groupService.getById(groupId);
        validateMember(group, requesterId);

        Map<Long, User> usersById = new LinkedHashMap<>();
        Map<Long, BigDecimal> net = new LinkedHashMap<>();
        for (User member : group.getMembers()) {
            usersById.put(member.getId(), member);
            net.put(member.getId(), BigDecimal.ZERO);
        }

        // Lo que cada uno pagó por gastos del grupo
        for (Expense expense : expenseRepository.findByGroup(group)) {
            net.merge(expense.getPaidBy().getId(), expense.getAmount(), BigDecimal::add);
        }

        // Lo que cada uno debe por su parte en esos gastos
        for (Split split : splitRepository.findByExpense_Group(group)) {
            net.merge(split.getUser().getId(), split.getAmount().negate(), BigDecimal::add);
        }

        // Pagos ya confirmados entre miembros ajustan el balance
        for (Settlement settlement : settlementRepository.findByGroupAndStatus(group, Settlement.Status.CONFIRMED)) {
            net.merge(settlement.getPaidBy().getId(), settlement.getAmount(), BigDecimal::add);
            net.merge(settlement.getPaidTo().getId(), settlement.getAmount().negate(), BigDecimal::add);
        }

        net.replaceAll((userId, amount) -> amount.setScale(2, RoundingMode.HALF_UP));

        List<UserBalanceResponse> balances = net.entrySet().stream()
                .map(entry -> UserBalanceResponse.of(usersById.get(entry.getKey()), entry.getValue()))
                .toList();

        List<SettlementSuggestionResponse> suggestions = simplifyDebts(net, usersById);

        return new GroupBalanceResponse(groupId, balances, suggestions);
    }

    /**
     * Greedy: en cada paso empareja al mayor deudor con el mayor acreedor.
     * Minimiza la cantidad de transacciones necesarias para saldar el grupo.
     */
    private List<SettlementSuggestionResponse> simplifyDebts(Map<Long, BigDecimal> net, Map<Long, User> usersById) {
        List<Map.Entry<Long, BigDecimal>> debtors = new ArrayList<>();
        List<Map.Entry<Long, BigDecimal>> creditors = new ArrayList<>();

        for (Map.Entry<Long, BigDecimal> entry : net.entrySet()) {
            int cmp = entry.getValue().compareTo(BigDecimal.ZERO);
            if (cmp < 0) {
                debtors.add(new AbstractMap.SimpleEntry<>(entry.getKey(), entry.getValue().abs()));
            } else if (cmp > 0) {
                creditors.add(new AbstractMap.SimpleEntry<>(entry.getKey(), entry.getValue()));
            }
        }

        List<SettlementSuggestionResponse> result = new ArrayList<>();

        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            debtors.sort((a, b) -> b.getValue().compareTo(a.getValue()));
            creditors.sort((a, b) -> b.getValue().compareTo(a.getValue()));

            Map.Entry<Long, BigDecimal> debtor = debtors.get(0);
            Map.Entry<Long, BigDecimal> creditor = creditors.get(0);

            BigDecimal amount = debtor.getValue().min(creditor.getValue());
            result.add(SettlementSuggestionResponse.of(
                    usersById.get(debtor.getKey()),
                    usersById.get(creditor.getKey()),
                    amount
            ));

            BigDecimal remainingDebt = debtor.getValue().subtract(amount);
            BigDecimal remainingCredit = creditor.getValue().subtract(amount);

            if (remainingDebt.compareTo(BigDecimal.ZERO) == 0) {
                debtors.remove(0);
            } else {
                debtor.setValue(remainingDebt);
            }

            if (remainingCredit.compareTo(BigDecimal.ZERO) == 0) {
                creditors.remove(0);
            } else {
                creditor.setValue(remainingCredit);
            }
        }

        return result;
    }

    private void validateMember(Group group, Long userId) {
        boolean isMember = group.getMembers().stream()
                .anyMatch(u -> u.getId().equals(userId));
        if (!isMember) {
            throw new UnauthorizedException("No sos miembro de este grupo");
        }
    }
}
