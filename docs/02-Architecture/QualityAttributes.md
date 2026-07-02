# Quality Attributes Mapping

**Document Version**: 1.1.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                                 | Author              |
| :------ | :--------- | :---------------------------------------------------------- | :------------------ |
| 1.1.0   | 2026-07-02 | Remediation: PostgreSQL queue ownership & SQL lock claiming | Principal Architect |
| 1.0.0   | 2026-07-02 | Initial release for Architecture Review                     | Principal Architect |

---

## Table of Contents

1. [Performance](#1-performance)
2. [Scalability](#2-scalability)
3. [Reliability](#3-reliability)
4. [Availability](#4-availability)
5. [Security](#5-security)
6. [Maintainability](#6-maintainability)
7. [Extensibility](#7-extensibility)
8. [Observability](#8-observability)
9. [Recoverability](#9-recoverability)
10. [Testability](#10-testability)
11. [Portability](#11-portability)

---

## 1. Performance

- **Why it Matters**: Low ingestion latency and fast scheduling updates are key to high-throughput systems.
- **Supporting Decisions**: Job claiming transitions to database transactional queries using `SELECT ... FOR UPDATE SKIP LOCKED` on indexed database tables.
- **Trade-offs**: Writes status changes directly to PostgreSQL, which increases write latency compared to Redis queues.
- **Measurement Strategy**: APM query latency monitors.

## 2. Scalability

- **Why it Matters**: The system must handle high job volumes without bottlenecking.
- **Supporting Decisions**: Stateless API and worker nodes can scale horizontally. Multiple workers poll PostgreSQL concurrently using `SKIP LOCKED` to prevent lock waiting.
- **Trade-offs**: Concurrent polling increases database connection pool utilization.
- **Measurement Strategy**: Simulated load tests using k6.

## 3. Reliability

- **Why it Matters**: Critical tasks must never be lost.
- **Supporting Decisions**: PostgreSQL is the single source of truth for all queues and states. Transactions and write-ahead logs (WAL) guarantee durability.
- **Trade-offs**: High durability increases write latencies.
- **Measurement Strategy**: Chaos monkey tests (killing database and worker instances).

## 4. Availability

- **Why it Matters**: The scheduling API must remain reachable by client applications.
- **Supporting Decisions**: Multi-AZ deployments, active-passive scheduler failovers, and auto-scaling.
- **Trade-offs**: Multi-AZ deployments increase network data transfer costs.
- **Measurement Strategy**: Synthetic liveness health probes.

## 5. Security

- **Why it Matters**: Multi-tenant systems require strict isolation.
- **Supporting Decisions**: JWT authentication, hashed API keys, and RBAC scoping.
- **Trade-offs**: JWT checks add CPU overhead on API gateways.
- **Measurement Strategy**: Automated penetration tests.

## 6. Maintainability

- **Why it Matters**: Codebase updates should be simple to deploy.
- **Supporting Decisions**: Monorepo workspace layouts, shared TS base, and ESLint flat configs.
- **Trade-offs**: Requires developers to learn pnpm/Turborepo monorepo management.
- **Measurement Strategy**: Setup time tracked via developer onboarding.

## 7. Extensibility

- **Why it Matters**: System needs to support future job runners.
- **Supporting Decisions**: Clean interfaces (`JobExecutor`) abstracting execution parameters.
- **Trade-offs**: Abstract interfaces can limit developer flexibility.
- **Measurement Strategy**: Code design reviews.

## 8. Observability

- **Why it Matters**: SRE teams must have visibility into system health.
- **Supporting Decisions**: JSON structured logging, Prometheus metric endpoints, and correlation IDs.
- **Trade-offs**: High log volume increases storage costs.
- **Measurement Strategy**: Log and trace volume metrics.

## 9. Recoverability

- **Why it Matters**: Systems must recover automatically from outages.
- **Supporting Decisions**: Schedulers scan PostgreSQL to clean expired worker leases.
- **Trade-offs**: Schedulers must scan PostgreSQL, which increases database read latency.
- **Measurement Strategy**: Simulated failover tests.

## 10. Testability

- **Why it Matters**: Changes must not introduce regressions.
- **Supporting Decisions**: Separation of stateless helpers from database adapters.
- **Measurement Strategy**: Statement coverage targets (minimum 80%).

## 11. Portability

- **Why it Matters**: Avoid cloud provider lock-in.
- **Supporting Decisions**: Standard Node.js runtimes packaged in OCI-compliant Docker containers.
- **Trade-offs**: Cannot use cloud-specific platform features.
- **Measurement Strategy**: Multi-cloud deployment checks.
