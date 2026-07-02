# ADR-007: Concurrency Model & Locking Strategy

**Status**: ACCEPTED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Context

High-volume concurrent workers polling shared queues can cause race conditions and duplicate task executions.

## Problem

What concurrency and locking strategies should we use to coordinate updates and prevent race conditions?

## Alternatives Considered

1. **Optimistic Locking for Job Claiming**: Query job states and update using version counters.
   - _Pros_: Low lock contention.
   - _Cons_: High conflict rates under high worker load, requiring complex retry loops in code.
2. **PostgreSQL Row-Level Locking (`SELECT FOR UPDATE SKIP LOCKED`)**: Lock selected job rows atomically during the claim query, instructing other transactions to skip locked rows.
   - _Pros_: Complete exclusion, zero double claiming, and high scalability across concurrent workers.
   - _Cons_: Requires managing transactional boundaries in database client modules.

## Decision

Adopt **Alternative 2**. We use row-level locking (`SELECT ... FOR UPDATE SKIP LOCKED`) within transaction blocks for job claiming, and optimistic locking (version counters) for configuration updates and metadata changes.

## Trade-offs & Consequences

- **Trade-offs**: Increased connection count during peaks. Handled via `pgBouncer` connection pools.
- **Consequences**:
  - Scales: Workers do not block waiting for other workers' locks; they skip locked rows immediately.
  - Race condition avoidance: Database engine serializes concurrent claim requests.
  - Safe-fail: Transaction rollback automatically releases locks if a worker crashes mid-claim.
