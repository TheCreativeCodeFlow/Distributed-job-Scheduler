# Known Limitations

This document presents the known limitations and accepted risks of the current Distributed Job Scheduler architecture.

## 1. In-Memory Rate Limiting

- **Limitation**: The current rate-limiter utilizes an in-memory store.
- **Impact**: In a multi-node horizontal scaling layout, each node tracks limits independently, meaning an attacker could bypass thresholds by distributing requests across nodes.
- **Accepted Risk**: Acceptable for initial single-instance deploys or behind a load balancer that applies sticky sessions.

---

## 2. Global Worker Topology

- **Limitation**: The `Worker` table doesn't have an `ownerId` or `userId`. All registered active workers are shared globally across projects/organizations.
- **Impact**: Any worker can claim jobs from any queue if it specifies the queue's slug.
- **Accepted Risk**: Assumes a trusted tenant worker execution environment.

---

## 3. Database lock Contention

- **Limitation**: Claiming operations perform a pessimistic write lock.
- **Impact**: High-frequency polling on a single queue from thousands of concurrent workers will cause transactional lock contention on the database engine.
- **Accepted Risk**: Mitigated by worker polling backoff delays and batch claims.
