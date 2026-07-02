# ADR-002: PostgreSQL as Source of Truth

**Status**: ACCEPTED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Context

Background job execution requires strict transactional consistency. A job status transition must not be lost during broker crashes or network outages.

## Problem

What technology should act as the authoritative source of truth for all job states, queues, and configurations?

## Alternatives Considered

1. **Redis-Only Storage**: Store all job metadata, queues, and execution states in Redis.
   - _Pros_: Sub-millisecond read/write latency.
   - _Cons_: High risk of data loss (in-memory volatility). Hard to query historical logs or run complex SQL reports.
2. **PostgreSQL as Sole Source of Truth and Queue Storage**: PostgreSQL stores all authoritative states, retry histories, and queue backlogs. Workers claim tasks directly from PostgreSQL. Redis coordinates transient states.
   - _Pros_: Complete ACID compliance, durable transactions, index optimization, and simple failover recovery.
   - _Cons_: Higher latency than pure memory caches.

## Decision

Adopt **Alternative 2**. PostgreSQL is the sole source of truth and storage owner for all Organizations, Projects, Queues, Jobs, Job Executions, Retry History, Dead Letter Queue, and Worker Metadata.

## Trade-offs & Consequences

- **Trade-offs**: Higher query latency for job claims compared to memory caches. Optimized using database indexes on queue name and status columns.
- **Consequences**:
  - Durability: Database WAL locks guarantee that job state is written to disk.
  - Consistency: PostgreSQL transaction boundaries prevent double claiming.
  - Recovery: If worker containers crash, active row locks automatically rollback.
