package com.finanzas.backend.user;

import com.finanzas.backend.user.dto.UserResponse;
import com.finanzas.backend.user.dto.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(Authentication authentication) {
        String email = authentication.getName();
        return userService.findByEmail(email)
                .map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        return userService.findById(id)
                .map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(
            @PathVariable Long id,
            @RequestBody UserUpdateRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        if (!id.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        User updated = userService.updateProfile(id, request.getUsername(), request.getAvatarUrl(), request.getPreferredCurrency());
        return ResponseEntity.ok(UserResponse.from(updated));
    }
}
