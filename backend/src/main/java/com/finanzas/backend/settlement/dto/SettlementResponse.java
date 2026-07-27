package com.finanzas.backend.settlement.dto;

import com.finanzas.backend.settlement.Settlement;
import com.finanzas.backend.user.dto.UserResponse;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class SettlementResponse {
    private Long id;
    private Long groupId;
    private UserResponse paidBy;
    private UserResponse paidTo;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String notes;
    private LocalDateTime settledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SettlementResponse from(Settlement settlement) {
        SettlementResponse dto = new SettlementResponse();
        dto.id = settlement.getId();
        dto.groupId = settlement.getGroup() != null ? settlement.getGroup().getId() : null;
        dto.paidBy = settlement.getPaidBy() != null ? UserResponse.from(settlement.getPaidBy()) : null;
        dto.paidTo = settlement.getPaidTo() != null ? UserResponse.from(settlement.getPaidTo()) : null;
        dto.amount = settlement.getAmount();
        dto.currency = settlement.getCurrency();
        dto.status = settlement.getStatus().name();
        dto.notes = settlement.getNotes();
        dto.settledAt = settlement.getSettledAt();
        dto.createdAt = settlement.getCreatedAt();
        dto.updatedAt = settlement.getUpdatedAt();
        return dto;
    }
}
