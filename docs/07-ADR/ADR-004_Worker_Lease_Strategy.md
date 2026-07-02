# ADR-004: Worker Lease Strategy

**Status**: ACCEPTED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Context

Worker instances run in containers that can crash, get terminated, or experience network partitions. The system must detect when a worker crashes during execution and reschedule the job.

## Problem

What strategy should we use to track worker health and prevent jobs from getting stuck in a running state?

## Alternatives Considered

1. **Dynamic Lease Durations**: Calculate leases dynamically based on job payload size and past runtimes.
   - _Pros_: Adaptive locks.
   - _Cons_: Highly complex; hard to predict lock expirations.
2. **Fixed Lease Durations with Periodic Heartbeat Renewals**: Configure a fixed lease duration (e.g. 30 seconds) in Redis. Active workers send heartbeats every 10 seconds to renew the lease. Schedulers scan PostgreSQL for jobs with expired Redis lease keys.
   - _Pros_: Simple, predictable, and easy to configure.
   - _Cons_: Minor network overhead from heartbeats.

## Decision

Adopt **Alternative 2**. We use fixed lease durations with periodic heartbeat renewals in Redis, integrated with PostgreSQL row-level locks.

## Trade-offs & Consequences

- **Trade-offs**: Workers must run background heartbeat threads, which increases connection counts.
- **Consequences**:
  - Stuck jobs are detected and rescheduled within 45 seconds.
  - Workers that lose network connectivity are blocked from writing results back to the database once their lease expires.
