package com.finanzas.backend.user;

import com.finanzas.backend.auth.CurrentUser;
import com.finanzas.backend.auth.UserPrincipal;
import com.finanzas.backend.user.dto.UserResponse;
import com.finanzas.backend.user.dto.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@CurrentUser UserPrincipal currentUser) {
        return userService.findById(currentUser.getId())
                .map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> search(
            @RequestParam String query,
            @CurrentUser UserPrincipal currentUser) {
        List<UserResponse> results = userService.search(query).stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .map(UserResponse::from)
                .toList();
        return ResponseEntity.ok(results);
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
            @CurrentUser UserPrincipal currentUser) {
        if (!id.equals(currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }
        User updated = userService.updateProfile(id, request.getUsername(), request.getAvatarUrl(), request.getPreferredCurrency());
        return ResponseEntity.ok(UserResponse.from(updated));
    }
}
