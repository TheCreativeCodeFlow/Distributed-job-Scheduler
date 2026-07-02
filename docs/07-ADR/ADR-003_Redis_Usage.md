# ADR-003: Redis Usage Strategy

**Status**: ACCEPTED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Context

Coordinating distributed workers requires locks, heartbeats, and rate limiting. Storing these transient states in a relational database increases lock contention.

## Problem

How should Redis be leveraged to coordinate worker tasks without compromising database durability?

## Alternatives Considered

1. **PostgreSQL-Only Coordination**: Manage all locks, heartbeats, and rate limits in PostgreSQL.
   - _Pros_: Single database engine.
   - _Cons_: High database write load and lock contention.
2. **Redis as Ephemeral Coordination Node**: Redis handles distributed locks, heartbeats, rate limiting, and wake-up notifications. PostgreSQL remains the sole owner of all job queues and states.
   - _Pros_: High performance for transient operations, low database write load, and simplified database scaling.
   - _Cons_: Requires managing a secondary cache broker.

## Decision

Adopt **Alternative 2**. Redis is used strictly for distributed locking, heartbeat tracking, cache, pub/sub, rate limiting, scheduler wake-up notifications, and ephemeral coordination state. Redis does NOT own or store job queues.

## Trade-offs & Consequences

- **Trade-offs**: Requires managing Redis connection states in the application code.
- **Consequences**:
  - Durability: If Redis reboots, no job data is lost.
  - Performance: Heartbeat renewals and lock checks are resolved in sub-milliseconds.
  - Scale: Reduces write load on PostgreSQL.
