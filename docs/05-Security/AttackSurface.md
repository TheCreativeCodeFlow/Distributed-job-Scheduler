# Attack Surface Analysis

This document identifies the entry points, protocols, and trust boundaries exposed by the Distributed Job Scheduler.

## 1. Exposed Interfaces

### Public REST API Endpoints

- **Authentication**: `POST /api/v1/auth/register`, `/login`, `/refresh`, `/logout`. These are publicly accessible (rate-limited) endpoints processing user credentials.
- **Workers API**: `/api/v1/workers/*`. Workers authenticate here to register, send heartbeats, and poll for jobs.
- **Jobs API**: `/api/v1/jobs/*` and `/api/v1/queues/*`. Requires authentication and organization/project permissions to submit and manage jobs.
- **DLQ & Metrics**: Admin-level endpoints for manual replay, system observability, and health.

### Swagger UI Docs

- Accessible at `/docs`. Displays endpoint definitions. Hardened with authentication schemes (`BearerAuth`).

---

## 2. Protocols and Ports

- **HTTP/HTTPS (Port 3000)**: The main channel for REST communication. Secure headers are applied via Helmet, and CORS is restricted via an allowlist.
- **Database Connection (Port 5432)**: Dedicated TCP connection to PostgreSQL, requiring SSL/TLS in production.
- **Redis Connection (Port 6379)**: Connection for rate-limiting status and token blocklists. Must be isolated in a private subnet.

---

## 3. Trust Boundaries

```
[ Public Internet ]
       │  CORS Allowlist / Rate Limiting (IP)
       ▼
 ┌───────────┐      JWT Check (requireAuth)
 │  API App  ├──────────────────────────────────┐
 └─────┬─────┘                                  │
       │                                        ▼
       │ Parameterized Queries          ┌──────────────┐
       ├───────────────────────────────>│  PostgreSQL  │
       │                                └──────────────┘
       │ Redis Protocol
       └───────────────────────────────>┌──────────────┐
                                        │    Redis     │
                                        └──────────────┘
```

- **Client-to-Server**: untrusted boundary. Hardened with body size limits, sanitizer middleware, rate limits, and JWT validation.
- **Server-to-Database**: trusted network zone. Relies on strong passwords and parameterized queries (ORM).
- **Server-to-Redis**: trusted network zone. Primarily utilized for ephemeral session blocklists and health checks.
