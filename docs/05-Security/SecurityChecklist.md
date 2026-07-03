# Security Checklist

This document outline the production security checklist for the Distributed Job Scheduler deployment.

## 1. Authentication & JWT Security

- [x] **Secure JWT Secret**: Must be at least 32 characters, random, and loaded from environment variables (`JWT_SECRET`).
- [x] **Token Expiration**: Access token expires in 15 minutes, refresh token in 7 days.
- [x] **Explicit Signature Algorithm**: Explicitly sign and verify using the `HS256` algorithm to prevent algorithm confusion attacks (`alg: none`).
- [x] **Refresh Token Rotation (RTR)**: Refresh tokens are single-use; the old refresh token is blocklisted in Redis upon rotation.
- [x] **JWT ID and Issuer Checks**: `jti` is verified; issuer (`iss`) and audience (`aud`) are verified on all parsed tokens.
- [x] **HttpOnly Cookie for Refresh Token**: Transmit refresh tokens via secure, HttpOnly, SameSite=Strict cookies to protect against XSS.

## 2. API Security & Rate Limiting

- [x] **Global Rate Limiter**: 200 requests per minute per IP limit on all endpoints.
- [x] **Auth Endpoint Protection**: Tighter rate limit of 10 requests per 15 minutes per IP on login, register, and refresh endpoints to prevent brute-force attacks.
- [x] **Payload Size Limits**: Body parser payload size capped at `100kb` for JSON/urlencoded payloads to prevent memory exhaustion DoS.
- [x] **Prototype Pollution Prevention**: Sanitizer middleware automatically strips dangerous keys like `__proto__`, `constructor`, and `prototype` from request bodies.
- [x] **CORS Allowlist**: Replaced wildcard CORS with explicit allowed origins mapping from `ALLOWED_ORIGINS`.

## 3. Worker & Job execution Security

- [x] **Worker Authentication**: Workers must register and communicate using valid authentication tokens (`requireAuth`).
- [x] **Job Ownership Validation**: Jobs claimed by a worker can only be started, completed, or failed by that specific worker ID.
- [x] **Tenant Separation**: Job execution parameters and scopes are isolated by organization and project boundaries.

## 4. Operational & Database Security

- [x] **Parameterized Queries**: Prisma ORM guarantees parameterized database queries, preventing SQL Injection (SQLi).
- [x] **Startup Env Validation**: Server validates required env vars (`JWT_SECRET`, `DATABASE_URL`) on startup, crashing early with fatal error if values are insecure or missing.
- [x] **PII Redaction in Logs**: Log messages redact emails and password fields on login or registration attempts.
- [x] **Structured Audit Logging**: Critical security and state-transition operations (claim, retry, replay, purge) are outputted to structured audit logs.
