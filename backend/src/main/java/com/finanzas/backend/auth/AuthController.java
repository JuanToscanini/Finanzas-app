package com.finanzas.backend.auth;

import com.finanzas.backend.auth.dto.AuthResponse;
import com.finanzas.backend.auth.dto.LoginRequest;
import com.finanzas.backend.auth.dto.RegisterRequest;
import com.finanzas.backend.user.User;
import com.finanzas.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        if (userService.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        if (userService.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // se hasheará con Spring Security
        User saved = userService.save(user);

        // el token real se generará cuando se integre JWT
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse("pending-jwt", saved.getId(), saved.getUsername(), saved.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return userService.findByEmail(request.getEmail())
                .map(user -> {
                    userService.updateLastLogin(user);
                    // la verificación del password y generación del token real van con JWT
                    return ResponseEntity.ok(new AuthResponse("pending-jwt", user.getId(), user.getUsername(), user.getEmail()));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
}
