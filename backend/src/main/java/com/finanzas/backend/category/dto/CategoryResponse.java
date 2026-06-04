package com.finanzas.backend.category.dto;

import com.finanzas.backend.category.Category;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {

    private Long id;
    private String name;
    private String icon;
    private String color;
    private Boolean isDefault;
    private Long createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getIcon(),
                category.getColor(),
                category.getIsDefault(),
                category.getCreatedBy() != null ? category.getCreatedBy().getId() : null,
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
