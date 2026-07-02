# ADR-010: Technology Stack Selection

**Status**: ACCEPTED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Context

Choosing a standardized technology stack ensures codebase compatibility across team boundaries.

## Problem

What programming language, workspace tool, databases, and configuration standards should we adopt?

## Alternatives Considered

1. **Node.js LTS + pnpm Monorepo**: TypeScript runtime, pnpm workspaces, PostgreSQL database, and Redis cache.
   - _Pros_: Fast execution, shared configurations, and developer familiarity.
   - _Cons_: Single-threaded Node loops require spawning separate subprocesses for CPU-heavy tasks.
2. **Go/Rust Backend**: Golang or Rust runtime engine.
   - _Pros_: Excellent performance and resource utilization.
   - _Cons_: Slower developer onboarding and lack of monorepo tooling integration with modern React dashboards.

## Decision

Adopt **Alternative 1** (Node.js LTS, TypeScript, pnpm workspace, PostgreSQL, and Redis).

## Trade-offs & Consequences

- **Trade-offs**: JavaScript execution runtimes require container resource limits to prevent memory leaks.
- **Consequences**:
  - Developers share code across apps (`apps/*`) and packages (`packages/*`).
  - Strict linting configurations (ESLint flat config) maintain code quality.
