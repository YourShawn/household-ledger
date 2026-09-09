package com.householdledger.auth.web;

import com.householdledger.common.domain.SharingTier;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(min = 1, max = 100) String displayName
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record SettingsRequest(
            SharingTier sharingTier,
            @Min(7) @Max(365) Integer checkInIntervalDays
    ) {
    }

    public record SessionResponse(
            String token,
            UserResponse user
    ) {
    }

    public record UserResponse(
            String id,
            String email,
            String displayName,
            SharingTier sharingTier,
            Instant lastCheckInAt,
            int checkInIntervalDays,
            boolean autoSendArmed,
            Instant autoSendTriggeredAt,
            String cryptoSalt,
            boolean autoBundlePresent,
            Instant createdAt
    ) {
    }
}
