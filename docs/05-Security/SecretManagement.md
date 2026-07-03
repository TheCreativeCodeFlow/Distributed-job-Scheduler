# Secret Management Guide

This document describes how credentials and secrets are managed, loaded, and rotated in the Distributed Job Scheduler.

## 1. Secrets Handling

The application complies with the **12-Factor App methodology**:

- No secrets are hardcoded in the codebase.
- Secrets are loaded exclusively from environment variables at runtime.
- For local development, secrets can be managed via `.env` files (which must be added to `.gitignore`).

---

## 2. Configuration Validation (`validateConfig`)

At bootstrap startup, `validateConfig()` executes the following checks:

- Verifies that all required variables (`JWT_SECRET`, `DATABASE_URL`) are defined.
- Asserts that `JWT_SECRET` is at least 32 characters long.
- Checks if the `JWT_SECRET` is set to known default insecure keys (e.g. `secret`, `password`) and logs a warning.
- If any critical check fails, the application prints a fatal log and terminates immediately with exit code `1`.

---

## 3. Secret Rotation Procedure

When rotating secrets in production:

1. **JWT Secret Rotation**:
   - Update the `JWT_SECRET` environment variable in the deployment environment.
   - Perform a rolling restart of the API containers.
   - Note: Active access tokens signed with the old secret will become immediately invalid, forcing clients to re-authenticate or use their refresh token (which will also require re-auth since it is verified with the new secret).
2. **Database Credentials**:
   - Update database passwords in the database provider.
   - Set the updated `DATABASE_URL` in the environment variables.
   - Perform a rolling restart of the API and worker processes.
