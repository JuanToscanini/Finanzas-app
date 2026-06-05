package com.finanzas.backend.auth;

import com.finanzas.backend.auth.dto.AuthResponse;
import com.finanzas.backend.auth.dto.LoginRequest;
import com.finanzas.backend.auth.dto.RegisterRequest;
import com.finanzas.backend.user.User;
import com.finanzas.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

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
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        User saved = userService.save(user);

        String token = jwtService.generateToken(saved.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(token, saved.getId(), saved.getUsername(), saved.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userService.findByEmail(request.getEmail())
                .orElseThrow();
        userService.updateLastLogin(user);

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail()));
    }
}
