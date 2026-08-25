package com.finanzas.backend.expense;

import com.finanzas.backend.auth.CurrentUser;
import com.finanzas.backend.auth.UserPrincipal;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.expense.dto.CreateExpenseRequest;
import com.finanzas.backend.expense.dto.ExpenseResponse;
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

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(
            @RequestBody CreateExpenseRequest request,
            @CurrentUser UserPrincipal currentUser) {
        Expense saved = expenseService.createFromRequest(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ExpenseResponse.from(saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> getById(@PathVariable Long id) {
        Expense expense = expenseService.getById(id);
        return ResponseEntity.ok(ExpenseResponse.from(expense));
    }

    @GetMapping("/me")
    public ResponseEntity<List<ExpenseResponse>> getMyExpenses(@CurrentUser UserPrincipal currentUser) {
        List<ExpenseResponse> expenses = expenseService.getByPaidBy(currentUser.getId())
                .stream().map(ExpenseResponse::from).toList();
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ExpenseResponse>> getByUser(
            @PathVariable Long userId,
            @CurrentUser UserPrincipal currentUser) {
        if (!userId.equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés ver los gastos de otro usuario");
        }
        List<ExpenseResponse> expenses = expenseService.getByPaidBy(userId)
                .stream().map(ExpenseResponse::from).toList();
        return ResponseEntity.ok(expenses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        expenseService.deleteExpense(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
