package com.householdledger.auth.web;

import com.householdledger.auth.service.AuthService;
import com.householdledger.auth.web.AuthDtos.LoginRequest;
import com.householdledger.auth.web.AuthDtos.RegisterRequest;
import com.householdledger.auth.web.AuthDtos.SessionResponse;
import com.householdledger.auth.web.AuthDtos.SettingsRequest;
import com.householdledger.auth.web.AuthDtos.UserResponse;
import com.householdledger.common.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a private ledger account")
    public SessionResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Sign in and receive a JWT")
    public SessionResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    @Operation(summary = "Current user profile and crypto salt")
    public UserResponse me() {
        return authService.me(CurrentUser.require().getUserId());
    }

    @PostMapping("/check-in")
    @Operation(summary = "Reset the missed-check-in timer")
    public UserResponse checkIn() {
        return authService.checkIn(CurrentUser.require().getUserId());
    }

    @PatchMapping("/settings")
    @Operation(summary = "Update sharing tier and check-in interval")
    public UserResponse settings(@Valid @RequestBody SettingsRequest request) {
        return authService.updateSettings(CurrentUser.require().getUserId(), request);
    }
}
