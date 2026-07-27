package com.finanzas.backend.category;

import com.finanzas.backend.category.dto.CategoryResponse;
import com.finanzas.backend.category.dto.CreateCategoryRequest;
import com.finanzas.backend.category.dto.UpdateCategoryRequest;
import com.finanzas.backend.common.exception.DuplicateResourceException;
import com.finanzas.backend.common.exception.ResourceNotFoundException;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.user.User;
import com.finanzas.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserService userService;

    public CategoryResponse create(Long userId, CreateCategoryRequest request) {
        User user = userService.getById(userId);

        if (categoryRepository.existsByNameAndCreatedBy(request.getName(), user)) {
            throw new DuplicateResourceException("Ya existe una categoría con ese nombre");
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setCreatedBy(user);
        category.setIsDefault(false);

        return CategoryResponse.from(categoryRepository.save(category));
    }

    public CategoryResponse update(Long categoryId, Long userId, UpdateCategoryRequest request) {
        Category category = getEntityById(categoryId);
        validateOwnership(category, userId);

        if (request.getName() != null) {
            User owner = category.getCreatedBy();
            if (!request.getName().equals(category.getName()) &&
                categoryRepository.existsByNameAndCreatedBy(request.getName(), owner)) {
                throw new DuplicateResourceException("Ya existe una categoría con ese nombre");
            }
            category.setName(request.getName());
        }
        if (request.getIcon() != null) {
            category.setIcon(request.getIcon());
        }
        if (request.getColor() != null) {
            category.setColor(request.getColor());
        }

        return CategoryResponse.from(categoryRepository.save(category));
    }

    public void delete(Long categoryId, Long userId) {
        Category category = getEntityById(categoryId);
        validateOwnership(category, userId);
        categoryRepository.delete(category);
    }

    public CategoryResponse getById(Long categoryId) {
        return CategoryResponse.from(getEntityById(categoryId));
    }

    public List<CategoryResponse> getAvailableForUser(Long userId) {
        User user = userService.getById(userId);

        List<Category> categories = new ArrayList<>();
        categories.addAll(categoryRepository.findByIsDefaultTrue());
        categories.addAll(categoryRepository.findByCreatedBy(user));

        return categories.stream().map(CategoryResponse::from).toList();
    }

    public Category getEntityById(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada: " + categoryId));
    }

    private void validateOwnership(Category category, Long userId) {
        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw new UnauthorizedException("No podés modificar una categoría del sistema");
        }
        if (category.getCreatedBy() == null || !category.getCreatedBy().getId().equals(userId)) {
            throw new UnauthorizedException("No tenés permiso para modificar esta categoría");
        }
    }
}
