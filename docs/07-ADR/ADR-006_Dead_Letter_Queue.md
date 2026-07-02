# ADR-006: Dead Letter Queue (DLQ) Strategy

**Status**: ACCEPTED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Context

Jobs that exhaust all retry attempts can block active worker queues if left unmanaged.

## Problem

How should we isolate and manage jobs that consistently fail execution?

## Alternatives Considered

1. **Discard Failures**: Delete tasks once their retry attempts are exhausted.
   - _Pros_: Keeps database sizes small.
   - _Cons_: Crucial debugging context is lost.
2. **Dead Letter Queue (DLQ) State Isolation**: Move failed tasks to a terminal `DEAD_LETTER` state in PostgreSQL with a 30-day retention policy.
   - _Pros_: Retains error context, supports manual inspection, and allows operators to replay jobs.
   - _Cons_: Requires regular database cleanup tasks to prevent bloat.

## Decision

Adopt **Alternative 2**. Failed jobs are moved to the DLQ in PostgreSQL with a default 30-day retention policy.

## Trade-offs & Consequences

- **Trade-offs**: Requires background sweep tasks to clean up expired DLQ records.
- **Consequences**:
  - Operators can inspect failures and replay jobs from the dashboard.
  - Limits database bloat.
