package com.finanzas.backend.category;

import com.finanzas.backend.auth.CurrentUser;
import com.finanzas.backend.auth.UserPrincipal;
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
            @CurrentUser UserPrincipal currentUser) {
        CategoryResponse category = categoryService.create(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAvailable(@CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(categoryService.getAvailableForUser(currentUser.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(categoryService.update(id, currentUser.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        categoryService.delete(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
