# Authentication Review

This document evaluates the authentication design and mechanisms used in the Distributed Job Scheduler.

## 1. Token Architecture

The system uses a stateless JSON Web Token (JWT) architecture with a two-token setup:

1. **Access Token**:
   - Short-lived: 15-minute expiration (`ACCESS_TOKEN_TTL`).
   - Contains: `sub` (User ID), `email`, `role`, `jti` (JWT ID), `iss`, and `aud`.
   - Transmitted via `Authorization: Bearer <token>` or optional `access_token` cookie.
2. **Refresh Token**:
   - Long-lived: 7-day expiration (`REFRESH_TOKEN_TTL`).
   - Contains: `sub`, `email`, `role`, `jti`, `iss`, and `aud`.
   - Stored in a secure, HttpOnly, SameSite=Strict cookie to prevent scripting access (XSS).

---

## 2. Refresh Token Rotation (RTR) & Replay Prevention

To prevent refresh tokens from being reused if stolen:

- When a client calls `POST /auth/refresh`, the server extracts the `jti` claim.
- It checks if this `jti` exists in the **Redis Token Blocklist** (`TokenBlocklist.isBlocked`).
- If blocked, the server immediately denies access with a 401 Unauthorized error (preventing token replay).
- If not blocked, the server blocklists the old `jti` for the remainder of its lifetime (7 days) and issues a fresh pair of tokens.

---

## 3. Cryptographic Hardening

- **Signature Algorithm**: Set to `HS256` explicitly during token signing and verification. This prevents JWT signature bypass attacks using the `alg: none` headers.
- **Verification Constraints**: `jwt.verify` strictly validates issuer (`iss = distributed-job-scheduler`) and audience (`aud = distributed-job-scheduler-api`).
- **Secret Length**: Regulated on startup to be at least 32 characters long.
