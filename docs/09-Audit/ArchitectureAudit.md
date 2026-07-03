# Architecture Audit

This document presents the architectural audit of the Distributed Job Scheduler codebase, evaluating modular boundaries, DDD aggregates, and layer consistency.

## 1. Modular Boundaries & Domain-Driven Design (DDD)

The codebase employs modular directory encapsulation inside `apps/api/src/modules/` (e.g. `auth/`, `organizations/`, `projects/`, `queues/`, `jobs/`, `workers/`, `scheduler/`, `metrics/`, `dashboard/`).

- **DDD Aggregates**:
  - `Organization` and `Project` aggregates are correctly isolated. Membership roles restrict actions across boundaries.
  - `Job` aggregate encapsulates `JobExecution`, `DeadLetterEntry`, and `WorkerLease`. Status changes are executed transactionally.
  - `Worker` acts as an independent aggregate tracking active heartbeats.

---

## 2. Dependency Direction & Layer Separation

The platform follows a strict layered architecture pattern:

```
[ HTTP Router ] ────> [ Controller ] ────> [ Service ] ────> [ Repository / DB ]
```

- **Controller Layer**: Decoupled from service layer details. Intercepts HTTP requests, runs schema validations (via Zod middleware), parses user scopes, and delegates business transitions.
- **Service Layer**: Pure domain logic. Leverages db transactions to coordinate writes. decibels (e.g. job claiming, scheduler promotion).Decoupled from Express request/response interfaces.
- **Repository / Database Layer**: Pure data access abstraction. Houses SQL operations.

---

## 3. ADR (Architecture Decision Record) Consistency

- **RTR (Refresh Token Rotation)**: Consistently implemented stateless tokens validated against Redis-backed single-use JTIs.
- **Atomic Job Claiming**: Leverages database transactions with pessimistic locks (`SELECT ... FOR UPDATE SKIP LOCKED` equivalent in transactional queue claiming) ensuring concurrency correctness.
- **RFC 7807 Standard**: Error formats consistently utilize structured problem details with compliant JSON headers and error type schemas.
