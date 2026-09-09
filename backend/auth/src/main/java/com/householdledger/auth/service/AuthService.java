package com.householdledger.auth.service;

import com.householdledger.auth.domain.User;
import com.householdledger.auth.repository.UserRepository;
import com.householdledger.auth.web.AuthDtos.LoginRequest;
import com.householdledger.auth.web.AuthDtos.RegisterRequest;
import com.householdledger.auth.web.AuthDtos.SessionResponse;
import com.householdledger.auth.web.AuthDtos.SettingsRequest;
import com.householdledger.auth.web.AuthDtos.UserResponse;
import com.householdledger.common.api.Ids;
import com.householdledger.common.domain.SharingTier;
import com.householdledger.common.exception.ApiException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public SessionResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("EMAIL_TAKEN", "An account with this email already exists");
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName().trim());
        user.setCryptoSalt(Ids.cryptoSalt());
        users.save(user);
        return new SessionResponse(jwtService.issue(user), toResponse(user));
    }

    @Transactional(readOnly = true)
    public SessionResponse login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> ApiException.unauthorized("Email or password is incorrect"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Email or password is incorrect");
        }
        return new SessionResponse(jwtService.issue(user), toResponse(user));
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return toResponse(require(userId));
    }

    @Transactional
    public UserResponse checkIn(Long userId) {
        User user = require(userId);
        user.setLastCheckInAt(java.time.Instant.now());
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateSettings(Long userId, SettingsRequest request) {
        User user = require(userId);
        if (request.sharingTier() != null) {
            user.setSharingTier(request.sharingTier());
            if (request.sharingTier() != SharingTier.AUTO_SEND) {
                user.setAutoSendArmed(false);
            }
        }
        if (request.checkInIntervalDays() != null) {
            user.setCheckInIntervalDays(request.checkInIntervalDays());
        }
        return toResponse(user);
    }

    public User require(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getPublicId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getSharingTier(),
                user.getLastCheckInAt(),
                user.getCheckInIntervalDays(),
                user.isAutoSendArmed(),
                user.getAutoSendTriggeredAt(),
                user.getCryptoSalt(),
                user.getAutoBundleCiphertext() != null && !user.getAutoBundleCiphertext().isBlank(),
                user.getCreatedAt()
        );
    }
}
