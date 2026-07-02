# ADR-008: Observability Strategy

**Status**: ACCEPTED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Context

Tracing asynchronous jobs across multiple containers (APIs, schedulers, workers) is difficult without structured telemetry.

## Problem

What standards should we use for logging, metrics, and tracing to provide operational observability?

## Alternatives Considered

1. **Standard Output Text Logs**: Standard output lines using Winston or Bunyan loggers.
   - _Pros_: Simple setup.
   - _Cons_: Difficult for log aggregation tools (Elasticsearch, Loki) to parse.
2. **JSON Structured Logs with OpenTelemetry integration**: Serialize logs to JSON format containing unified tracking context, Prometheus metrics endpoints, and OpenTelemetry trace headers.
   - _Pros_: Standardized schema formats, query-ready logs, and cross-boundary tracing.
   - _Cons_: Increased log storage requirements.

## Decision

Adopt **Alternative 2**. We use JSON structured logging, Prometheus metric endpoints, and OpenTelemetry-compatible tracing wrappers.

## Trade-offs & Consequences

- **Trade-offs**: Increased storage costs for log storage.
- **Consequences**:
  - Correlation IDs propagate across API, Redis, and Worker containers.
  - Exposes standard `/metrics` and `/ready` endpoints for automated scraper and load-balancer probes.
