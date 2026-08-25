package com.finanzas.backend.settlement;

import com.finanzas.backend.auth.CurrentUser;
import com.finanzas.backend.auth.UserPrincipal;
import com.finanzas.backend.common.exception.UnauthorizedException;
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
            @CurrentUser UserPrincipal currentUser) {
        Settlement settlement = settlementService.createSettlement(
                request.getGroupId(),
                currentUser.getId(),
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
    public ResponseEntity<List<SettlementResponse>> getByGroup(
            @PathVariable Long groupId,
            @CurrentUser UserPrincipal currentUser) {
        List<SettlementResponse> settlements = settlementService.getByGroup(groupId)
                .stream().map(SettlementResponse::from).toList();
        return ResponseEntity.ok(settlements);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SettlementResponse>> getByUser(
            @PathVariable Long userId,
            @CurrentUser UserPrincipal currentUser) {
        if (!userId.equals(currentUser.getId())) {
            throw new UnauthorizedException("No podés ver los pagos de otro usuario");
        }
        List<SettlementResponse> settlements = settlementService.getByUser(userId)
                .stream().map(SettlementResponse::from).toList();
        return ResponseEntity.ok(settlements);
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<SettlementResponse> confirm(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(SettlementResponse.from(settlementService.confirmSettlement(id, currentUser.getId())));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<SettlementResponse> reject(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(SettlementResponse.from(settlementService.rejectSettlement(id, currentUser.getId())));
    }
}
