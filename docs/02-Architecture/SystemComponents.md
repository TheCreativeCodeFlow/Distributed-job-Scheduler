# Component Architecture Design

**Document Version**: 1.1.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                                 | Author              |
| :------ | :--------- | :---------------------------------------------------------- | :------------------ |
| 1.1.0   | 2026-07-02 | Remediation: PostgreSQL queue ownership & SQL lock claiming | Principal Architect |
| 1.0.0   | 2026-07-02 | Initial release for Architecture Review                     | Principal Architect |

---

## Table of Contents

1. [API Container Components](#1-api-container-components)
2. [Scheduler Container Components](#2-scheduler-container-components)
3. [Worker Container Components](#3-worker-container-components)
4. [Dashboard Container Components](#4-dashboard-container-components)

---

## 1. API Container Components

### 1.1. Authentication Module

- **Responsibilities**: Validates user JWT claims and programmatic API key signatures.
- **Dependencies**: `@repo/shared` schemas.
- **Interfaces**: Express Middleware handler.
- **Failure Boundary**: Fails closed (rejects requests on validation errors).
- **Ownership**: Platform Security Team.

### 1.2. Project & Queue Modules

- **Responsibilities**: Manages tenant projects, registers queue parameters, and controls pause/resume states.
- **Dependencies**: `@repo/database` (Prisma client).
- **Interfaces**: REST Router handlers.
- **Failure Boundary**: Database timeout errors cascade to return HTTP 503.
- **Ownership**: Platform Core Team.

### 1.3. Job Module

- **Responsibilities**: Receives scheduling payloads, verifies structures against Zod schemas, and writes metadata records directly to PostgreSQL (status: `SCHEDULED` or `QUEUED`). Pushes optional wake-up notifications to Redis.
- **Dependencies**: `@repo/database`, `@repo/shared`, Redis client wrapper (for wake-up triggers).
- **Interfaces**: `POST /v1/jobs`, `POST /v1/jobs/:id/cancel` endpoints.
- **Failure Boundary**: Isolated task failures return validation failures without blocking the engine.
- **Ownership**: Developer Experience Team.

---

## 2. Scheduler Container Components

### 2.1. Scheduling Engine & Cron Processor

- **Responsibilities**: Evaluates cron records and determines when recurring tasks require enqueuing directly in PostgreSQL.
- **Dependencies**: `@repo/database`, `@repo/utils`, Redis lock client.
- **Interfaces**: Internal minute timer tick loop.
- **Failure Boundary**: A lock renewal crash pauses cron executions; resolved when a standby node claims the active lock.
- **Ownership**: Platform Core Team.

### 2.2. Delay Processor & Lease Manager

- **Responsibilities**: Promotes delayed tasks whose start time has arrived directly in PostgreSQL. Scans for expired worker leases (tracked in Redis/PostgreSQL) and schedules retries.
- **Dependencies**: `@repo/database`.
- **Interfaces**: Internal loop ticker (every 10 seconds).
- **Failure Boundary**: Skips are caught during subsequent ticks.
- **Ownership**: Platform Core Team.

---

## 3. Worker Container Components

### 3.1. Polling Engine & Claims Handler

- **Responsibilities**: Polls PostgreSQL and claims jobs atomically via `SELECT ... FOR UPDATE SKIP LOCKED` transaction blocks.
- **Dependencies**: `@repo/database`.
- **Interfaces**: Infinite sleep-poller thread.
- **Failure Boundary**: PostgreSQL connection drops pause polling.
- **Ownership**: Background Engines Team.

### 3.2. Execution Engine

- **Responsibilities**: Spawns isolated execution contexts (processes or sandboxed threads) and executes job payloads.
- **Dependencies**: `@repo/logger`, `@repo/utils`.
- **Interfaces**: Run method implementing `JobExecutor` interface.
- **Failure Boundary**: Process crashes trigger lease timeouts and reschedule.
- **Ownership**: Background Engines Team.

### 3.3. Heartbeat Manager & Graceful Shutdown

- **Responsibilities**: Periodic lease updates in Redis during task execution. Catches `SIGTERM` signals and allows running tasks to complete.
- **Dependencies**: Redis client connection.
- **Interfaces**: Heartbeat timer loop.
- **Failure Boundary**: Heartbeat failure marks the job as lost, preventing the worker from updating database states.
- **Ownership**: Infrastructure Team.

---

## 4. Dashboard Container Components

### 4.1. Explorer Modules (Queue, Worker, Job)

- **Responsibilities**: Provides administrative visibility into active tasks and states.
- **Dependencies**: API Gateway.
- **Interfaces**: React components.
- **Failure Boundary**: Failures display offline banners; job execution is unaffected.
- **Ownership**: Frontend Operations Team.
