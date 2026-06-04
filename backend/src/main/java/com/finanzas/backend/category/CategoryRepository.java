package com.finanzas.backend.category;

import com.finanzas.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByCreatedBy(User createdBy);

    List<Category> findByIsDefaultTrue();

    boolean existsByNameAndCreatedBy(String name, User createdBy);
}
