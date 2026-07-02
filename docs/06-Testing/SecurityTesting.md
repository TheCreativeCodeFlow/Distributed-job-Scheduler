# Security Testing

This document details security analysis and dependency scanning guidelines.

## 1. Static Analysis (SAST)

- Automatic package dependency audits (`pnpm audit`).
- Code vulnerability scans using tools like Snyk or GitHub CodeQL.

## 2. Dynamic Audits (DAST)

- Injection testing on API endpoints.
- Verification of token expiration enforcement.
