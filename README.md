# 物资家底账本 / Household Ledger

Private **wealth inventory** — know and organize what you have (物资、卡、钱、债、保险、钥匙、账号提示、文件位置). Optional sharing with people you trust.  
私密家底账本：把**财**与家底记清楚；接收人可选；可在约一个月未报到后把**密文包**发给指定人。

MIT licensed. Encryption runs in the browser (AES-256-GCM, PBKDF2-SHA-256). Server stores **ciphertext**. No bank API.

---

## English

### What it is

A private ledger for household wealth and facts. Each field has **one** meaning. Kinds:

| Kind | Meaning | Fields (one semantic each) |
| --- | --- | --- |
| 物资 / Goods | Things you keep | name, location, quantity, notes |
| 卡 / Card | Cards (hints only) | name, issuer, last-4 hint, expiry hint, where kept |
| 钱 / Cash | Cash-like holdings | name, amount hint, currency, where kept |
| 债 / Debt | Money owed | name, counterparty, amount hint, due hint |
| 保险 / Insurance | Policies | name, provider, policy hint, contact |
| 钥匙 / Key | Keys | name, what it opens, where kept |
| 账号提示 / Account hint | Recovery hints — **not passwords** | name, service, username hint, recovery hint |
| 文件位置 / File location | Where paper lives | name, description, where kept |

Recipients are **optional**. Three tiers:

1. **Record only (只记不发)** — encrypt in place; sharing APIs return 403.
2. **Record + manual share (记+手动分享)** — you mint a ciphertext link.
3. **Record + designated people + auto-send (记+指定人+逾期自动发)** — you name recipients, arm an encrypted bundle, and check in. After `check_in_interval_days` (default **30 ≈ one month**) without check-in, the server copies the bundle to a retrieve link and emails recipients if SMTP is configured; otherwise it **logs** the notice.

Recipients still need the unlock phrase you shared out of band. The API never sees plaintext item fields.

### Demo

Sign in as `demo@household-ledger.local` / `DemoPass123!`.

The client vault **auto-unlocks with the same login password** — no second passphrase prompt. The vault passphrase is never sent to the server. Login password is only for JWT.

If an older local canary was created with a different phrase, use **Forgot vault passphrase / reset local vault** (`忘记保险柜口令 / 重置本机保险柜`). That clears `hl.canary.${userId}` and `hl.vault` on this device, then re-unlocks with the login password. Ciphertext already stored on the server still needs the old phrase if any items were encrypted with it; empty demo ledgers are fine to reset.

### Architecture

```
frontend/          React 19 + Vite + TypeScript (responsive SPA)
backend/
  common/          errors, enums, security principal
  auth/            register/login/JWT/check-in/settings
  inventory/       items, recipients, shares, auto-send
  app/             Spring Boot 3.5, Flyway, OpenAPI, scheduler
```

Layering is controller → service → repository. Primary keys and foreign keys are in Flyway (`docs/schema.md`).

### Run locally (no Docker)

Java 17+, Maven, Node 22+.

```bash
# API with local H2 (MySQL-mode) — good for development
cd backend && mvn -pl app -am spring-boot:run -Dspring-boot.run.profiles=local
# UI (proxies /api to :8080)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173 · OpenAPI http://localhost:8080/swagger-ui.html

### Run with Docker Compose (external MySQL)

Compose does **not** start MySQL by default. Point the app at MySQL on **localhost / private** (`MYSQL_HOST=127.0.0.1`) — never a public server IP.

```bash
cp .env.example .env   # MYSQL_HOST=127.0.0.1; set JWT_SECRET and DB passwords
docker compose up --build
```

If the API runs **inside Compose** and MySQL is on the same machine, set `MYSQL_HOST=host.docker.internal` (Compose maps this to the host gateway). Do not use a public IP.

App: http://localhost:8088 · API: http://localhost:8080

Optional local solo demo (starts MySQL on the private Compose network; published only on `127.0.0.1:3306`):

```bash
MYSQL_HOST=mysql docker compose --profile bundled-mysql up --build
```

### Tests

```bash
chmod +x scripts/smoke.sh && ./scripts/smoke.sh
# or:
cd backend && mvn test
cd frontend && npm test
```

CI: `.github/workflows/ci.yml`.

### Configuration

See `.env.example`. Notable keys: `JWT_SECRET`, `MYSQL_HOST` (`127.0.0.1` / private only), MySQL credentials, optional `MAIL_HOST` for real auto-send email.

Client-side vault passphrase is **not** sent to the server. After login, the vault defaults to that same password in the browser only.

---

## 中文

### 这是什么

私密家底账本：把物资、卡、钱、债、保险、钥匙、账号提示、文件位置记清楚。每一格只记一件事。接收人可以不填。

三档：

1. **只记不发** — 只在浏览器加密后存到服务器。
2. **记 + 手动分享** — 你自己生成密文链接。
3. **记 + 指定人 + 约一个月未报到自动发** — 先武装密文包并报到；逾期则发出链接（有 SMTP 则发邮件，否则只记发送日志）。

对方仍需你当面（或其它渠道）告知的口令。服务器没有明文，也没有银行接口。

### 演示

登录：`demo@household-ledger.local` / `DemoPass123!`。

保险柜**自动使用同一登录密码**，无需第二次输入。口令只留在浏览器，不会发到服务器。

若本机曾用另一口令写过保险柜标记，点 **忘记保险柜口令 / 重置本机保险柜**。空演示账本可直接重置。

### 如何运行

开发可用 H2（`local` profile）+ Vite。Docker Compose 默认只启动后端 + 前端，MySQL 需本机/私网（`127.0.0.1`，不要用公网 IP）。本地单机演示可用 `docker compose --profile bundled-mysql`（并设 `MYSQL_HOST=mysql`）。架构、表结构、OpenAPI 见 `backend/`、`docs/schema.md`、`docs/openapi.yaml`。

---

## License

[MIT](LICENSE)
