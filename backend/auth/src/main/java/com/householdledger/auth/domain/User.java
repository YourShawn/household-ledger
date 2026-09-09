package com.householdledger.auth.domain;

import com.householdledger.common.api.Ids;
import com.householdledger.common.domain.SharingTier;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36, updatable = false)
    private String publicId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "sharing_tier", nullable = false, length = 32)
    private SharingTier sharingTier = SharingTier.RECORD_ONLY;

    @Column(name = "last_check_in_at", nullable = false)
    private Instant lastCheckInAt;

    @Column(name = "check_in_interval_days", nullable = false)
    private int checkInIntervalDays = 30;

    @Column(name = "auto_send_armed", nullable = false)
    private boolean autoSendArmed;

    @Column(name = "auto_send_triggered_at")
    private Instant autoSendTriggeredAt;

    @Column(name = "crypto_salt", nullable = false, length = 64)
    private String cryptoSalt;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(name = "auto_bundle_ciphertext")
    private String autoBundleCiphertext;

    @Column(name = "auto_bundle_nonce", length = 64)
    private String autoBundleNonce;

    @Column(name = "auto_bundle_kdf_salt", length = 64)
    private String autoBundleKdfSalt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (publicId == null) {
            publicId = Ids.publicId();
        }
        if (lastCheckInAt == null) {
            lastCheckInAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getPublicId() {
        return publicId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public SharingTier getSharingTier() {
        return sharingTier;
    }

    public void setSharingTier(SharingTier sharingTier) {
        this.sharingTier = sharingTier;
    }

    public Instant getLastCheckInAt() {
        return lastCheckInAt;
    }

    public void setLastCheckInAt(Instant lastCheckInAt) {
        this.lastCheckInAt = lastCheckInAt;
    }

    public int getCheckInIntervalDays() {
        return checkInIntervalDays;
    }

    public void setCheckInIntervalDays(int checkInIntervalDays) {
        this.checkInIntervalDays = checkInIntervalDays;
    }

    public boolean isAutoSendArmed() {
        return autoSendArmed;
    }

    public void setAutoSendArmed(boolean autoSendArmed) {
        this.autoSendArmed = autoSendArmed;
    }

    public Instant getAutoSendTriggeredAt() {
        return autoSendTriggeredAt;
    }

    public void setAutoSendTriggeredAt(Instant autoSendTriggeredAt) {
        this.autoSendTriggeredAt = autoSendTriggeredAt;
    }

    public String getCryptoSalt() {
        return cryptoSalt;
    }

    public void setCryptoSalt(String cryptoSalt) {
        this.cryptoSalt = cryptoSalt;
    }

    public String getAutoBundleCiphertext() {
        return autoBundleCiphertext;
    }

    public void setAutoBundleCiphertext(String autoBundleCiphertext) {
        this.autoBundleCiphertext = autoBundleCiphertext;
    }

    public String getAutoBundleNonce() {
        return autoBundleNonce;
    }

    public void setAutoBundleNonce(String autoBundleNonce) {
        this.autoBundleNonce = autoBundleNonce;
    }

    public String getAutoBundleKdfSalt() {
        return autoBundleKdfSalt;
    }

    public void setAutoBundleKdfSalt(String autoBundleKdfSalt) {
        this.autoBundleKdfSalt = autoBundleKdfSalt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
