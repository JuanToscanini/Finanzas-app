package com.finanzas.backend.expense;

import com.finanzas.backend.category.Category;
import com.finanzas.backend.expense.dto.CreateExpenseRequest;
import com.finanzas.backend.expense.dto.ExpenseResponse;
import com.finanzas.backend.group.Group;
import com.finanzas.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(
            @RequestBody CreateExpenseRequest request,
            @RequestHeader("X-User-Id") Long userId) {

        Expense expense = new Expense();
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setCurrency(request.getCurrency());
        expense.setSplitType(request.getSplitType());
        expense.setDate(request.getDate());
        expense.setNotes(request.getNotes());
        expense.setReceiptUrl(request.getReceiptUrl());
        expense.setPaidBy(userService.getById(userId));

        if (request.getGroupId() != null) {
            Group group = new Group();
            group.setId(request.getGroupId());
            expense.setGroup(group);
        }
        if (request.getCategoryId() != null) {
            Category category = new Category();
            category.setId(request.getCategoryId());
            expense.setCategory(category);
        }

        Expense saved = expenseService.createExpense(expense, request.getParticipantIds(), request.getCustomValues());
        return ResponseEntity.status(HttpStatus.CREATED).body(ExpenseResponse.from(saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> getById(@PathVariable Long id) {
        Expense expense = expenseService.getById(id);
        return ResponseEntity.ok(ExpenseResponse.from(expense));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ExpenseResponse>> getByUser(@PathVariable Long userId) {
        List<ExpenseResponse> expenses = expenseService.getByPaidBy(userId)
                .stream().map(ExpenseResponse::from).toList();
        return ResponseEntity.ok(expenses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        expenseService.deleteExpense(id, userId);
        return ResponseEntity.noContent().build();
    }
}
