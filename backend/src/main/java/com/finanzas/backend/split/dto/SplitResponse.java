package com.finanzas.backend.split.dto;

import com.finanzas.backend.split.Split;
import com.finanzas.backend.user.dto.UserResponse;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class SplitResponse {
    private Long id;
    private Long expenseId;
    private UserResponse user;
    private BigDecimal amount;
    private BigDecimal percentage;
    private Boolean isSettled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SplitResponse from(Split split) {
        SplitResponse dto = new SplitResponse();
        dto.id = split.getId();
        dto.expenseId = split.getExpense() != null ? split.getExpense().getId() : null;
        dto.user = split.getUser() != null ? UserResponse.from(split.getUser()) : null;
        dto.amount = split.getAmount();
        dto.percentage = split.getPercentage();
        dto.isSettled = split.getIsSettled();
        dto.createdAt = split.getCreatedAt();
        dto.updatedAt = split.getUpdatedAt();
        return dto;
    }
}
