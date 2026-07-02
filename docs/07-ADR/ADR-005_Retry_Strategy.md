# ADR-005: Retry Strategy

**Status**: ACCEPTED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Context

Background jobs can fail due to temporary network issues, downstream API timeouts, or database locks. The platform must automatically retry failed tasks.

## Problem

What strategy should we use to retry failed jobs to prevent overwhelming downstream services?

## Alternatives Considered

1. **Immediate Retries**: Re-enqueue failed jobs immediately.
   - _Pros_: Low processing latency on transient errors.
   - _Cons_: Can overload failing downstream systems (thundering herd problem).
2. **Exponential Backoff with Jitter**: Delay retries exponentially (e.g. 2s, 4s, 8s...) with random jitter.
   - _Pros_: Distributes retry spikes and protects downstream services.
   - _Cons_: Delayed task execution.

## Decision

Adopt **Alternative 2**. Failed jobs are rescheduled using exponential backoffs with random jitter.

## Trade-offs & Consequences

- **Trade-offs**: Jobs do not retry immediately, which increases processing latency.
- **Consequences**:
  - Prevents cascading failures.
  - Schedulers promote retried tasks back to active queues once their backoff delay has elapsed.
