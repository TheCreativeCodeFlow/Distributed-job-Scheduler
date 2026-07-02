# API Authentication

This document details client authentication, token generation, and authorization boundaries.

## 1. Authentication Protocols

- **JWT Tokens**: Used for dashboard user sessions (`apps/web` to `apps/api`).
- **API Keys**: Used for programmatic job ingestion access. Prefixed with `djs_` (e.g. `djs_live_...`).

## 2. Authorization Scopes

- `read:jobs`
- `write:jobs`
- `admin`
