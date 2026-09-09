package com.householdledger.inventory.web;

import com.householdledger.common.domain.ItemKind;
import com.householdledger.common.domain.ShareKind;
import com.householdledger.common.domain.SharingTier;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class InventoryDtos {
    private InventoryDtos() {
    }

    public record EncryptedPayload(
            @NotBlank @Size(max = 2_000_000) String ciphertext,
            @NotBlank @Size(max = 64) String nonce
    ) {
    }

    public record ItemWriteRequest(
            @NotNull ItemKind kind,
            @NotBlank @Size(max = 2_000_000) String ciphertext,
            @NotBlank @Size(max = 64) String nonce
    ) {
    }

    public record ItemResponse(
            String id,
            ItemKind kind,
            String ciphertext,
            String nonce,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record RecipientWriteRequest(
            @NotBlank @Size(max = 100) String name,
            @Email @NotBlank String email,
            @Size(max = 100) String relationship
    ) {
    }

    public record RecipientResponse(
            String id,
            String name,
            String email,
            String relationship,
            Instant createdAt
    ) {
    }

    public record ShareCreateRequest(
            @NotBlank @Size(max = 8_000_000) String ciphertext,
            @NotBlank @Size(max = 64) String nonce,
            @NotBlank @Size(max = 64) String kdfSalt
    ) {
    }

    public record ArmAutoSendRequest(
            @NotBlank @Size(max = 8_000_000) String ciphertext,
            @NotBlank @Size(max = 64) String nonce,
            @NotBlank @Size(max = 64) String kdfSalt
    ) {
    }

    public record ShareResponse(
            String id,
            ShareKind shareKind,
            Instant expiresAt,
            Instant createdAt,
            String retrievePath
    ) {
    }

    public record PublicShareResponse(
            String id,
            ShareKind shareKind,
            String kdfSalt,
            String ciphertext,
            String nonce,
            Instant expiresAt,
            Instant createdAt
    ) {
    }

    public record NoticeResponse(
            String id,
            String recipientName,
            String recipientEmail,
            String channel,
            String status,
            String detail,
            Instant createdAt
    ) {
    }

    public record DashboardResponse(
            long itemCount,
            long recipientCount,
            SharingTier sharingTier,
            Instant lastCheckInAt,
            int checkInIntervalDays,
            boolean autoSendArmed,
            Instant autoSendTriggeredAt,
            List<KindCount> byKind
    ) {
    }

    public record KindCount(ItemKind kind, long count) {
    }
}
