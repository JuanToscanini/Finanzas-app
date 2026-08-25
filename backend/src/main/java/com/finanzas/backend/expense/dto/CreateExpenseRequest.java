package com.finanzas.backend.expense.dto;

import com.finanzas.backend.expense.Expense;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class CreateExpenseRequest {
    private String description;
    private BigDecimal amount;
    private String currency;
    private Expense.SplitType splitType;
    private Long groupId;
    private Long categoryId;
    private LocalDate date;
    private String notes;
    private String receiptUrl;

    // Quien pagó el gasto. Si no se manda, se usa el usuario autenticado (JWT)
    private Long paidById;

    // IDs de los participantes del gasto
    private List<Long> participantIds;

    // Para PERCENTAGE: Map<userId, porcentaje>
    // Para EXACT:      Map<userId, monto>
    // Para EQUAL:      se ignora
    private Map<Long, BigDecimal> customValues;
}
