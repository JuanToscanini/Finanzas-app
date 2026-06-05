package com.finanzas.backend.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User save(User user) {
        return userRepository.save(user);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public void updateLastLogin(User user) {
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    public User updateProfile(Long id, String username, String avatarUrl, String preferredCurrency) {
        User user = getById(id);
        if (username != null && !username.isBlank()) {
            if (!username.equals(user.getUsername()) && existsByUsername(username)) {
                throw new RuntimeException("El username ya está en uso");
            }
            user.setUsername(username);
        }
        if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
        if (preferredCurrency != null && !preferredCurrency.isBlank()) user.setPreferredCurrency(preferredCurrency);
        return userRepository.save(user);
    }
}
