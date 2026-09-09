# Database schema

物资家底账本 stores **ciphertext** for a private wealth inventory. The server can filter by `kind` and run check-in / auto-send, but it cannot read field values. There is **no** bank API.

## Entity-relationship

```
users 1───< recipients
users 1───< ledger_items
users 1───< shares
users 1───< outbound_notices
shares 1───< outbound_notices   (optional FK)
```

All tables use a numeric `id` primary key and a `public_id` VARCHAR(36) UUID for API identifiers. Foreign keys use `ON DELETE CASCADE` (notices → shares uses `ON DELETE SET NULL`).

## Tables

### users
| Column | Type | Notes |
| --- | --- | --- |
| id | BIGINT PK | |
| public_id | VARCHAR(36) UK | API id |
| email | VARCHAR(255) UK | login |
| password_hash | VARCHAR(255) | BCrypt (login only; not the vault key) |
| display_name | VARCHAR(100) | |
| sharing_tier | VARCHAR(32) | `RECORD_ONLY` / `MANUAL_SHARE` / `AUTO_SEND` |
| last_check_in_at | DATETIME(3) | dead-man timer origin |
| check_in_interval_days | INT | default 30 (~1 month) |
| auto_send_armed | BOOLEAN | owner uploaded a ciphertext bundle |
| auto_send_triggered_at | DATETIME(3) | null until fire |
| crypto_salt | VARCHAR(64) | public PBKDF2 salt for client-side AES-GCM |
| auto_bundle_ciphertext / nonce | LONGTEXT / VARCHAR | last armed bundle |
| created_at / updated_at | DATETIME(3) | |

### ledger_items
Typed entries. **One semantic per field lives in the client JSON**, then the whole payload is encrypted.

| Column | Type | Notes |
| --- | --- | --- |
| kind | VARCHAR(32) | `ASSET` 物资, `CARD` 卡, `MONEY` 钱, `DEBT` 债, `INSURANCE` 保险, `KEY` 钥匙, `ACCOUNT_HINT` 账号提示, `FILE_LOCATION` 文件位置 |
| ciphertext / nonce | LONGTEXT / VARCHAR | AES-256-GCM, client-only |

### recipients
Optional. Needed only for tiers 2–3 (manual share / auto-send). Email is stored in plaintext so the server can notify; relationship is a short label.

### shares
Public retrieve token = `public_id`. Payload is still ciphertext. TTL default 90 days. `kdf_salt` is stored so a recipient can derive the wrap key without an account.

### outbound_notices
Audit of auto-send attempts (`SENT`, `FAILED`, `LOGGED_NO_SMTP`).

## Sharing tiers

1. **RECORD_ONLY (只记不发)** — inventory only; share APIs return 403.
2. **MANUAL_SHARE (记+手动分享)** — owner posts an encrypted bundle and gets a link.
3. **AUTO_SEND (记+指定人+逾期自动发)** — owner adds recipients, arms a bundle, and checks in. After `check_in_interval_days` without check-in, the scheduler copies the bundle to `shares` and emails (or logs) each recipient.

Recipients still need the unlock phrase the owner shared out of band. The server never has the vault key.

## Migrations

Flyway: `backend/app/src/main/resources/db/migration/V1__init.sql`.
