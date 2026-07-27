package com.finanzas.backend.settlement;

import com.finanzas.backend.settlement.dto.CreateSettlementRequest;
import com.finanzas.backend.settlement.dto.SettlementResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @PostMapping
    public ResponseEntity<SettlementResponse> create(
            @Valid @RequestBody CreateSettlementRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        Settlement settlement = settlementService.createSettlement(
                request.getGroupId(),
                userId,
                request.getPaidToId(),
                request.getAmount(),
                request.getCurrency(),
                request.getNotes()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(SettlementResponse.from(settlement));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SettlementResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(SettlementResponse.from(settlementService.getById(id)));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<SettlementResponse>> getByGroup(@PathVariable Long groupId) {
        List<SettlementResponse> settlements = settlementService.getByGroup(groupId)
                .stream().map(SettlementResponse::from).toList();
        return ResponseEntity.ok(settlements);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SettlementResponse>> getByUser(@PathVariable Long userId) {
        List<SettlementResponse> settlements = settlementService.getByUser(userId)
                .stream().map(SettlementResponse::from).toList();
        return ResponseEntity.ok(settlements);
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<SettlementResponse> confirm(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(SettlementResponse.from(settlementService.confirmSettlement(id, userId)));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<SettlementResponse> reject(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(SettlementResponse.from(settlementService.rejectSettlement(id, userId)));
    }
}
