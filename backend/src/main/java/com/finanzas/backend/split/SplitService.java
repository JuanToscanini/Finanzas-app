package com.finanzas.backend.split;

import com.finanzas.backend.category.Category;
import com.finanzas.backend.common.exception.ResourceNotFoundException;
import com.finanzas.backend.common.exception.ValidationException;
import com.finanzas.backend.expense.Expense;
import com.finanzas.backend.expense.ExpenseService;
import com.finanzas.backend.split.dto.CategoryExpenseResponse;
import com.finanzas.backend.split.dto.MonthlyExpenseResponse;
import com.finanzas.backend.user.User;
import com.finanzas.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SplitService {

    private final SplitRepository splitRepository;
    private final ExpenseService expenseService;
    private final UserService userService;

    public Split create(Long expenseId, Long userId, BigDecimal amount, BigDecimal percentage) {
        Expense expense = expenseService.getById(expenseId);
        User user = userService.getById(userId);

        Split split = new Split();
        split.setExpense(expense);
        split.setUser(user);
        split.setAmount(amount);
        split.setPercentage(percentage);
        split.setIsSettled(false);

        return splitRepository.save(split);
    }

    public Split getById(Long splitId) {
        return splitRepository.findById(splitId)
                .orElseThrow(() -> new ResourceNotFoundException("Split no encontrado: " + splitId));
    }

    public List<Split> getByExpense(Long expenseId) {
        Expense expense = expenseService.getById(expenseId);
        return splitRepository.findByExpense(expense);
    }

    public List<Split> getByUser(Long userId) {
        User user = userService.getById(userId);
        return splitRepository.findByUser(user);
    }

    public List<Split> getUnsettledByUser(Long userId) {
        User user = userService.getById(userId);
        return splitRepository.findByUserAndIsSettledFalse(user);
    }

    @Transactional
    public Split markAsSettled(Long splitId) {
        Split split = getById(splitId);
        split.setIsSettled(true);
        return splitRepository.save(split);
    }

    // --- estadísticas para el dashboard ---

    public List<CategoryExpenseResponse> getExpensesByCategory(Long userId) {
        User user = userService.getById(userId);

        Map<Long, Category> categoriesById = new LinkedHashMap<>();
        Map<Long, BigDecimal> totalsByCategory = new LinkedHashMap<>();

        for (Split split : splitRepository.findByUser(user)) {
            Category category = split.getExpense().getCategory();
            Long key = category != null ? category.getId() : -1L; // -1 = "sin categoría"

            categoriesById.putIfAbsent(key, category);
            totalsByCategory.merge(key, split.getAmount(), BigDecimal::add);
        }

        return totalsByCategory.entrySet().stream()
                .map(entry -> CategoryExpenseResponse.of(
                        categoriesById.get(entry.getKey()),
                        entry.getValue().setScale(2, RoundingMode.HALF_UP)
                ))
                .sorted(Comparator.comparing(CategoryExpenseResponse::getTotal).reversed())
                .toList();
    }

    public List<MonthlyExpenseResponse> getMonthlyExpenses(Long userId, int months) {
        if (months < 1 || months > 24) {
            throw new ValidationException("months debe estar entre 1 y 24");
        }

        User user = userService.getById(userId);

        YearMonth currentMonth = YearMonth.now();
        YearMonth from = currentMonth.minusMonths(months - 1L);

        Map<YearMonth, BigDecimal> totalsByMonth = new LinkedHashMap<>();
        for (int i = 0; i < months; i++) {
            totalsByMonth.put(from.plusMonths(i), BigDecimal.ZERO);
        }

        for (Split split : splitRepository.findByUser(user)) {
            YearMonth expenseMonth = YearMonth.from(split.getExpense().getDate());
            if (!expenseMonth.isBefore(from) && !expenseMonth.isAfter(currentMonth)) {
                totalsByMonth.merge(expenseMonth, split.getAmount(), BigDecimal::add);
            }
        }

        return totalsByMonth.entrySet().stream()
                .map(entry -> MonthlyExpenseResponse.of(entry.getKey(), entry.getValue().setScale(2, RoundingMode.HALF_UP)))
                .toList();
    }
}
