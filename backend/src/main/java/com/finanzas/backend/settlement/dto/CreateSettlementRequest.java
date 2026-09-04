package com.finanzas.backend.settlement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateSettlementRequest {

    // Null significa "pago suelto sin grupo" entre dos amigos.
    private Long groupId;

    @NotNull(message = "Paid to id is required")
    private Long paidToId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @Size(min = 3, max = 3)
    private String currency;

    private String notes;
}
