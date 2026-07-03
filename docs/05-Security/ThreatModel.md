# Threat Model

This threat model outlines the primary security threats to the Distributed Job Scheduler using the STRIDE methodology.

## 1. Spoofing

- **Threat**: Attackers register a fake worker to claim jobs.
  - **Mitigation**: All worker registration and heartbeat endpoints require valid JWT authentication.
- **Threat**: Attackers replay rotated refresh tokens.
  - **Mitigation**: Refresh token rotation tracks `jti` in a Redis-backed blocklist, preventing reuse.

## 2. Tampering

- **Threat**: Malformed payloads injected during job submission to cause remote code execution or application crashes.
  - **Mitigation**: Zod schemas validate the request body structures, and prototype pollution sanitizer removes dangerous keys (`__proto__`).
- **Threat**: Modifying job execution status of another worker's job.
  - **Mitigation**: The execution service strictly checks job-to-worker ownership before processing transitions.

## 3. Repudiation

- **Threat**: Users or workers performing sensitive actions (e.g. replaying jobs from DLQ, deleting queues) and claiming they did not.
  - **Mitigation**: The audit logger outputs structured logs containing the `userId`, action name, resource ID, and client IP without exposing sensitive payloads.

## 4. Information Disclosure

- **Threat**: Sensitive credentials (e.g. database password, JWT secret) leaking in application logs.
  - **Mitigation**: Application loggers are configured to filter/redact input emails and ignore plain credentials. Unhandled errors do not leak stack traces to clients.
- **Threat**: Cross-tenant data leakage where User A views jobs of Organization B.
  - **Mitigation**: Access control checks validate organization membership before allowing project or queue resource retrieval.

## 5. Denial of Service (DoS)

- **Threat**: Throttling/hanging the application event loop via long password inputs processed by bcrypt.
  - **Mitigation**: Capped password inputs to a maximum of 72 characters (bcrypt's limit).
- **Threat**: Out-of-memory crashes from receiving extremely large JSON request payloads.
  - **Mitigation**: Express body parsers enforce a strict `100kb` limit globally.
- **Threat**: Brute-force credentials polling or API abuse.
  - **Mitigation**: Implemented IP-based rate limiting: global limiter (200 req/min) and auth limiter (10 req/15min).

## 6. Elevation of Privilege

- **Threat**: Standard user executing tenant administration commands or system settings updates.
  - **Mitigation**: RBAC middleware (`requireRoles`) validates that the user possesses appropriate privileges (e.g., `ORG_OWNER`, `SYSTEM_ADMIN`) before proceeding.
