package com.finanzas.backend.expense;

import com.finanzas.backend.category.CategoryRepository;
import com.finanzas.backend.common.exception.ResourceNotFoundException;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.expense.dto.CreateExpenseRequest;
import com.finanzas.backend.group.Group;
import com.finanzas.backend.group.GroupRepository;
import com.finanzas.backend.notification.NotificationService;
import com.finanzas.backend.split.Split;
import com.finanzas.backend.user.User;
import com.finanzas.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserService userService;
    private final GroupRepository groupRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationService notificationService;

    @Transactional
    public Expense createFromRequest(CreateExpenseRequest request, Long userId) {
        Expense expense = new Expense();
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setCurrency(request.getCurrency());
        expense.setSplitType(request.getSplitType());
        expense.setDate(request.getDate());
        expense.setNotes(request.getNotes());
        expense.setReceiptUrl(request.getReceiptUrl());

        Group group = null;
        if (request.getGroupId() != null) {
            group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado: " + request.getGroupId()));
            expense.setGroup(group);
        }

        Long payerId = request.getPaidById() != null ? request.getPaidById() : userId;
        if (group != null) {
            validateGroupMember(group, payerId);
        }
        expense.setPaidBy(userService.getById(payerId));

        if (request.getCategoryId() != null) {
            expense.setCategory(categoryRepository.getReferenceById(request.getCategoryId()));
        }

        List<Split> splits = buildSplits(expense, request.getParticipantIds(), request.getCustomValues());
        expense.setSplits(splits);
        Expense saved = expenseRepository.save(expense);

        if (group != null) {
            notifyGroupMembers(saved, group);
        }

        return saved;
    }

    private void notifyGroupMembers(Expense expense, Group group) {
        String message = String.format(
                "%s agregó un gasto de $%s en %s: %s",
                expense.getPaidBy().getUsername(), expense.getAmount(), group.getName(), expense.getDescription()
        );

        for (User member : group.getMembers()) {
            if (!member.getId().equals(expense.getPaidBy().getId())) {
                notificationService.create(member.getId(), "EXPENSE_CREATED", message, expense.getId(), "EXPENSE");
            }
        }
    }

    private void validateGroupMember(Group group, Long userId) {
        boolean isMember = group.getMembers().stream()
                .anyMatch(u -> u.getId().equals(userId));
        if (!isMember) {
            throw new UnauthorizedException("El pagador elegido no es miembro del grupo");
        }
    }

    public Expense getById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto no encontrado: " + id));
    }

    public List<Expense> getByPaidBy(Long userId) {
        User user = userService.getById(userId);
        return expenseRepository.findByPaidBy(user);
    }

    @Transactional
    public void deleteExpense(Long expenseId, Long userId) {
        Expense expense = getById(expenseId);

        if (!expense.getPaidBy().getId().equals(userId)) {
            throw new UnauthorizedException("Solo quien pagó puede eliminar el gasto");
        }

        expenseRepository.delete(expense);
    }

    // --- splits ---

    private List<Split> buildSplits(Expense expense, List<Long> participantIds, Map<Long, BigDecimal> customValues) {
        return switch (expense.getSplitType()) {
            case EQUAL -> buildEqualSplits(expense, participantIds);
            case PERCENTAGE -> buildPercentageSplits(expense, participantIds, customValues);
            case EXACT -> buildExactSplits(expense, participantIds, customValues);
        };
    }

    private List<Split> buildEqualSplits(Expense expense, List<Long> participantIds) {
        BigDecimal share = expense.getAmount()
                .divide(BigDecimal.valueOf(participantIds.size()), 2, RoundingMode.HALF_UP);

        List<Split> splits = new ArrayList<>();
        for (Long userId : participantIds) {
            splits.add(newSplit(expense, userId, share, null));
        }
        return splits;
    }

    private List<Split> buildPercentageSplits(Expense expense, List<Long> participantIds, Map<Long, BigDecimal> percentages) {
        List<Split> splits = new ArrayList<>();
        for (Long userId : participantIds) {
            BigDecimal pct = percentages.getOrDefault(userId, BigDecimal.ZERO);
            BigDecimal amount = expense.getAmount()
                    .multiply(pct)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            splits.add(newSplit(expense, userId, amount, pct));
        }
        return splits;
    }

    private List<Split> buildExactSplits(Expense expense, List<Long> participantIds, Map<Long, BigDecimal> exactAmounts) {
        List<Split> splits = new ArrayList<>();
        for (Long userId : participantIds) {
            BigDecimal amount = exactAmounts.getOrDefault(userId, BigDecimal.ZERO);
            splits.add(newSplit(expense, userId, amount, null));
        }
        return splits;
    }

    private Split newSplit(Expense expense, Long userId, BigDecimal amount, BigDecimal percentage) {
        User user = userService.getById(userId);
        Split split = new Split();
        split.setExpense(expense);
        split.setUser(user);
        split.setAmount(amount);
        split.setPercentage(percentage);
        split.setIsSettled(false);
        return split;
    }
}
