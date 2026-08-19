package com.finanzas.backend.expense.dto;

import com.finanzas.backend.expense.Expense;
import com.finanzas.backend.user.dto.UserResponse;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseResponse {
    private Long id;
    private String description;
    private BigDecimal amount;
    private String currency;
    private String splitType;
    private Long groupId;
    private Long categoryId;
    private UserResponse paidBy;
    private LocalDate date;
    private String notes;
    private String receiptUrl;

    public static ExpenseResponse from(Expense expense) {
        ExpenseResponse dto = new ExpenseResponse();
        dto.id = expense.getId();
        dto.description = expense.getDescription();
        dto.amount = expense.getAmount();
        dto.currency = expense.getCurrency();
        dto.splitType = expense.getSplitType().name();
        dto.groupId = expense.getGroup() != null ? expense.getGroup().getId() : null;
        dto.categoryId = expense.getCategory() != null ? expense.getCategory().getId() : null;
        dto.paidBy = UserResponse.from(expense.getPaidBy());
        dto.date = expense.getDate();
        dto.notes = expense.getNotes();
        dto.receiptUrl = expense.getReceiptUrl();
        return dto;
    }
}
