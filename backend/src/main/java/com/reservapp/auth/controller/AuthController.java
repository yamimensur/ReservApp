package com.reservapp.auth.controller;

import com.reservapp.auth.dto.LoginRequest;
import com.reservapp.auth.dto.LoginResponse;
import com.reservapp.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) { return auth.login(request); }
}