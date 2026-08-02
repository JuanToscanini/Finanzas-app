package com.finanzas.backend.split.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.YearMonth;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyExpenseResponse {

    private int year;
    private int month;
    private String label; // "2026-03"
    private BigDecimal total;

    public static MonthlyExpenseResponse of(YearMonth yearMonth, BigDecimal total) {
        return new MonthlyExpenseResponse(yearMonth.getYear(), yearMonth.getMonthValue(), yearMonth.toString(), total);
    }
}
