-- Household Ledger schema. Compatible with MySQL 8 and H2 (MODE=MySQL).

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    sharing_tier VARCHAR(32) NOT NULL DEFAULT 'RECORD_ONLY',
    last_check_in_at DATETIME(3) NOT NULL,
    check_in_interval_days INT NOT NULL DEFAULT 30,
    auto_send_armed BOOLEAN NOT NULL DEFAULT FALSE,
    auto_send_triggered_at DATETIME(3) NULL,
    crypto_salt VARCHAR(64) NOT NULL,
    auto_bundle_ciphertext LONGTEXT NULL,
    auto_bundle_nonce VARCHAR(64) NULL,
    auto_bundle_kdf_salt VARCHAR(64) NULL,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_public_id UNIQUE (public_id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE recipients (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NULL,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_recipients_public_id UNIQUE (public_id),
    CONSTRAINT uk_recipients_user_email UNIQUE (user_id, email),
    CONSTRAINT fk_recipients_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE ledger_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    kind VARCHAR(32) NOT NULL,
    ciphertext LONGTEXT NOT NULL,
    nonce VARCHAR(64) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_items_public_id UNIQUE (public_id),
    CONSTRAINT fk_items_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_items_user_kind ON ledger_items (user_id, kind);

CREATE TABLE shares (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    share_kind VARCHAR(16) NOT NULL,
    kdf_salt VARCHAR(64) NOT NULL,
    ciphertext LONGTEXT NOT NULL,
    nonce VARCHAR(64) NOT NULL,
    expires_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_shares_public_id UNIQUE (public_id),
    CONSTRAINT fk_shares_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE outbound_notices (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    share_id BIGINT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    channel VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL,
    detail VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_notices_public_id UNIQUE (public_id),
    CONSTRAINT fk_notices_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_notices_share FOREIGN KEY (share_id) REFERENCES shares (id) ON DELETE SET NULL
);
