# Security Audit

This document presents the security audit of the Distributed Job Scheduler, verifying authentication, authorization, and data boundary validations.

## 1. Authentication & JWT Hardening

- **Signature Security**: Tokens are verified using explicit algorithms (`algorithms: ['HS256']`). This blocks `alg: none` header exploits.
- **RTR Replay Protection**: Refresh tokens are rotated dynamically. Old JTIs are saved to a Redis-backed blocklist for the remainder of their lifetime, preventing stolen token replays.
- **Claims Verification**: Tokens strictly validate issuer (`iss`) and audience (`aud`) values on verification.

---

## 2. Authorization & Tenant Isolation

- **RBAC Guards**: Endpoint groups are gated using role checks (`SYSTEM_ADMIN`, `ORG_OWNER`, `ORG_ADMIN`, `DEVELOPER`, `READ_ONLY`). Unauthenticated or roles with insufficient permissions are rejected with 401/403 errors.
- **Organization Boundaries**: Non-admin users are restricted to organization memberships they own or belong to. Database queries filter resources (projects, queues, jobs, DLQ logs) using tenant memberships list.
- **Worker/Job Scopes**: Execution endpoints (start, complete, fail) strictly validate job-to-worker ownership before permitting state modifications.

---

## 3. Input Validation & Logging

- **Input Capping**: Capped incoming HTTP payloads at `100kb` to prevent memory exhaustion DoS. Registration passwords are limited to 72 characters to block bcrypt computation DoS attacks.
- **Prototype Pollution Prevention**: Global middleware strips `__proto__`, `constructor`, and `prototype` keys from request bodies.
- **Audit Trails**: Structured, PII-free logs output system events (claim, replay, registration transitions) containing operator ID and client IP.
