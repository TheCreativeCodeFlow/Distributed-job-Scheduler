# ADR-001: System Architecture Style

**Status**: ACCEPTED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

- **1.0.0 (2026-07-02)**: Initial design approval.

---

## Context

The platform must support high-throughput job ingestion and execution. The architecture needs to isolate web requests, background workers, and scheduling engines to prevent resource starvation.

## Problem

How should we structure and deploy the scheduling platform components to ensure independence, fault tolerance, and ease of development?

## Alternatives Considered

1. **Monolithic Service**: A single application containing APIs, schedulers, and workers.
   - _Pros_: Simple codebase.
   - _Cons_: Starves API resources under high worker loads; cannot scale components independently.
2. **Decoupled Monorepo with Separated Compute Runtimes**: Separate Node processes for APIs, workers, and schedulers managed in a single monorepo.
   - _Pros_: Independent scaling, clear trust boundaries, shared code libraries, and simple local developer setup.
   - _Cons_: Requires monorepo tooling (pnpm, Turborepo).

## Decision

Adopt **Alternative 2** (Decoupled Monorepo with Separated Compute Runtimes). The codebase is structured using `pnpm` workspaces, isolating executable apps (`apps/api`, `apps/worker`, `apps/web`) from shared package configurations (`packages/*`).

## Trade-offs & Consequences

- **Trade-offs**: Requires monorepo management tooling.
- **Consequences**:
  - API, worker, and scheduler nodes run in separate container pools.
  - SRE can scale worker containers based on queue depth without impacting API ingress endpoints.
  - Shared models (Prisma) and validation schemas (Zod) are imported as local packages.
