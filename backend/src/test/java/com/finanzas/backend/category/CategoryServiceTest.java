package com.finanzas.backend.category;

import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Cubre la protección de categorías del sistema: delete() delega en
 * validateOwnership(), que rechaza tanto las categorías default (isDefault = true)
 * como las que pertenecen a otro usuario.
 */
@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private com.finanzas.backend.user.UserService userService;

    @InjectMocks
    private CategoryService categoryService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = user(1L, "alice");
        userB = user(2L, "bob");
    }

    @Test
    void delete_defaultCategory_throwsUnauthorized() {
        Category defaultCategory = category(10L, null, true);
        when(categoryRepository.findById(10L)).thenReturn(Optional.of(defaultCategory));

        assertThatThrownBy(() -> categoryService.delete(10L, userA.getId()))
                .isInstanceOf(UnauthorizedException.class);

        verify(categoryRepository, never()).delete(any());
    }

    @Test
    void delete_ownNonDefaultCategory_deletesSuccessfully() {
        Category ownCategory = category(20L, userA, false);
        when(categoryRepository.findById(20L)).thenReturn(Optional.of(ownCategory));

        assertThatCode(() -> categoryService.delete(20L, userA.getId())).doesNotThrowAnyException();

        verify(categoryRepository).delete(ownCategory);
    }

    @Test
    void delete_anotherUsersCategory_throwsUnauthorized() {
        Category othersCategory = category(30L, userB, false);
        when(categoryRepository.findById(30L)).thenReturn(Optional.of(othersCategory));

        assertThatThrownBy(() -> categoryService.delete(30L, userA.getId()))
                .isInstanceOf(UnauthorizedException.class);

        verify(categoryRepository, never()).delete(any());
    }

    // --- helpers ---

    private static User user(Long id, String username) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setEmail(username + "@test.com");
        return u;
    }

    private static Category category(Long id, User owner, boolean isDefault) {
        Category c = new Category();
        c.setId(id);
        c.setName("Comida");
        c.setCreatedBy(owner);
        c.setIsDefault(isDefault);
        return c;
    }
}
