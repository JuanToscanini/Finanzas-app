package com.finanzas.backend.split;

import com.finanzas.backend.split.dto.SplitResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/splits")
@RequiredArgsConstructor
public class SplitController {

    private final SplitService splitService;

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
    public ResponseEntity<List<SplitResponse>> getByUser(@PathVariable Long userId) {
        List<SplitResponse> splits = splitService.getByUser(userId)
                .stream().map(SplitResponse::from).toList();
        return ResponseEntity.ok(splits);
    }

    @GetMapping("/user/{userId}/unsettled")
    public ResponseEntity<List<SplitResponse>> getUnsettledByUser(@PathVariable Long userId) {
        List<SplitResponse> splits = splitService.getUnsettledByUser(userId)
                .stream().map(SplitResponse::from).toList();
        return ResponseEntity.ok(splits);
    }

    @PutMapping("/{id}/settled")
    public ResponseEntity<SplitResponse> markAsSettled(@PathVariable Long id) {
        return ResponseEntity.ok(SplitResponse.from(splitService.markAsSettled(id)));
    }
}
