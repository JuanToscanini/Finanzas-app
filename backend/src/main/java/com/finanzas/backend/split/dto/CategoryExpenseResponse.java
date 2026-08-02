package com.finanzas.backend.split.dto;

import com.finanzas.backend.category.Category;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryExpenseResponse {

    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;
    private BigDecimal total;

    public static CategoryExpenseResponse of(Category category, BigDecimal total) {
        if (category == null) {
            return new CategoryExpenseResponse(null, "Sin categoría", null, null, total);
        }
        return new CategoryExpenseResponse(
                category.getId(), category.getName(), category.getIcon(), category.getColor(), total
        );
    }
}
