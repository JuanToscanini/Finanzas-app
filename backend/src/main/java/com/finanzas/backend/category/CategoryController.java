package com.finanzas.backend.category;

import com.finanzas.backend.category.dto.CategoryResponse;
import com.finanzas.backend.category.dto.CreateCategoryRequest;
import com.finanzas.backend.category.dto.UpdateCategoryRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponse> create(
            @Valid @RequestBody CreateCategoryRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        CategoryResponse category = categoryService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAvailable(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(categoryService.getAvailableForUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(categoryService.update(id, userId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        categoryService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
