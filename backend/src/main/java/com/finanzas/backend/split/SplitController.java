package com.finanzas.backend.split;

import com.finanzas.backend.auth.CurrentUser;
import com.finanzas.backend.auth.UserPrincipal;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.split.dto.CategoryExpenseResponse;
import com.finanzas.backend.split.dto.CreateSplitRequest;
import com.finanzas.backend.split.dto.MonthlyExpenseResponse;
import com.finanzas.backend.split.dto.SplitResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/splits")
@RequiredArgsConstructor
public class SplitController {

    private final SplitService splitService;

    @PostMapping
    public ResponseEntity<SplitResponse> create(@Valid @RequestBody CreateSplitRequest request) {
        Split split = splitService.create(
                request.getExpenseId(),
                request.getUserId(),
                request.getAmount(),
                request.getPercentage()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(SplitResponse.from(split));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SplitResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(SplitResponse.from(splitService.getById(id)));
    }

    @GetMapping("/expense/{expenseId}")
    public ResponseEntity<List<SplitResponse>> getByExpense(@PathVariable Long expenseId) {
        List<SplitResponse> splits = splitService.getByExpense(expenseId)
                .stream().map(SplitResponse::from).toList();
        return ResponseEntity.ok(splits);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SplitResponse>> getByUser(
            @PathVariable Long userId,
            @CurrentUser UserPrincipal currentUser) {
        if (!userId.equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés ver los splits de otro usuario");
        }
        List<SplitResponse> splits = splitService.getByUser(userId)
                .stream().map(SplitResponse::from).toList();
        return ResponseEntity.ok(splits);
    }

    @GetMapping("/user/{userId}/unsettled")
    public ResponseEntity<List<SplitResponse>> getUnsettledByUser(
            @PathVariable Long userId,
            @CurrentUser UserPrincipal currentUser) {
        if (!userId.equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés ver los splits de otro usuario");
        }
        List<SplitResponse> splits = splitService.getUnsettledByUser(userId)
                .stream().map(SplitResponse::from).toList();
        return ResponseEntity.ok(splits);
    }

    @PutMapping("/{id}/settled")
    public ResponseEntity<SplitResponse> markAsSettled(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        Split split = splitService.getById(id);
        boolean isDebtor = split.getUser().getId().equals(currentUser.getId());
        boolean isPayer = split.getExpense().getPaidBy().getId().equals(currentUser.getId());
        if (!isDebtor && !isPayer) {
            throw new UnauthorizedException("No podés modificar este split");
        }
        return ResponseEntity.ok(SplitResponse.from(splitService.markAsSettled(id)));
    }

    @GetMapping("/user/{userId}/stats/by-category")
    public ResponseEntity<List<CategoryExpenseResponse>> getStatsByCategory(
            @PathVariable Long userId,
            @CurrentUser UserPrincipal currentUser) {
        if (!userId.equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés ver las estadísticas de otro usuario");
        }
        return ResponseEntity.ok(splitService.getExpensesByCategory(userId));
    }

    @GetMapping("/user/{userId}/stats/by-month")
    public ResponseEntity<List<MonthlyExpenseResponse>> getStatsByMonth(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "6") int months,
            @CurrentUser UserPrincipal currentUser) {
        if (!userId.equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés ver las estadísticas de otro usuario");
        }
        return ResponseEntity.ok(splitService.getMonthlyExpenses(userId, months));
    }
}
