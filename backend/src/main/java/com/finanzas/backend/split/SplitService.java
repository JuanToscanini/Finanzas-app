package com.finanzas.backend.split;

import com.finanzas.backend.expense.Expense;
import com.finanzas.backend.expense.ExpenseService;
import com.finanzas.backend.user.User;
import com.finanzas.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SplitService {

    private final SplitRepository splitRepository;
    private final ExpenseService expenseService;
    private final UserService userService;

    public Split getById(Long splitId) {
        return splitRepository.findById(splitId)
                .orElseThrow(() -> new RuntimeException("Split no encontrado: " + splitId));
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
}
