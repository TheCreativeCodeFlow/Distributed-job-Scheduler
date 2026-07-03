# Performance Testing Strategy

## Overview

This document describes the performance testing strategy for the Distributed Job Scheduler. The goal is to validate that the scheduler remains stable, correct, and efficient under realistic production workloads.

All performance tests are API-level integration tests powered by **Vitest**. They exercise real service logic, mocked database interactions where needed, and precisely measure latency distributions and throughput.

---

## Principles

- **No Scheduler Logic Modification**: Performance tests are purely observational. Scheduler business logic is not changed unless a genuine defect is discovered.
- **Tenant-Safe**: All benchmark scenarios respect organisation boundaries.
- **Automation-First**: Every scenario runs as part of the CI pipeline via `pnpm --filter @repo/api test src/tests/performance`.
- **Reproducible**: Randomness is seeded or eliminated where possible to ensure repeatable results.

---

## Test Categories

| Category        | Description                                                          |
| :-------------- | :------------------------------------------------------------------- |
| **Load**        | Sustained, steady-rate job submission (10, 100, 1000 jobs/sec).      |
| **Stress**      | Beyond-normal scheduler promotion loads.                             |
| **Spike**       | Sudden extreme bursts of queue creation.                             |
| **Soak**        | Extended endurance runs to detect memory and throughput degradation. |
| **Concurrency** | High-parallelism worker polling to validate zero duplicate claims.   |

---

## Framework

- **Runner**: `apps/api/src/tests/performance/benchmarks/runner.ts`
  - Collects per-scenario latency samples, calculates P50/P95/P99 percentiles, and measures RSS memory.
  - Persists data via a temp JSON file across test files (Vitest isolation boundary).
  - On soak test completion, emits the final `reports/PerformanceReport.md`.

- **Entry Point**: `apps/api/src/tests/performance/performance.perf.test.ts`
  - Consolidated suite executing all benchmarks sequentially with `db` mocks.

---

## Running Tests

```bash
# Run all performance benchmarks
pnpm --filter @repo/api test src/tests/performance/performance.perf.test.ts

# Run individual categories
pnpm --filter @repo/api test src/tests/performance/load
pnpm --filter @repo/api test src/tests/performance/stress
pnpm --filter @repo/api test src/tests/performance/concurrency
```

---

## Report Output

After each run, the report is automatically regenerated at:

```
apps/api/src/tests/performance/reports/PerformanceReport.md
```

Includes throughput (ops/sec), latency percentiles (P50/P95/P99), success rate, and RSS memory per scenario.
