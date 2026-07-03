# Future Roadmap

This document outlines recommended upgrades for the Distributed Job Scheduler platform.

## 1. Redis-Backed Rate Limiting

- **Upgrade**: Replace `express-rate-limit`'s in-memory store with `rate-limit-redis`.
- **Value**: Syncs rate limits across horizontally scaled API nodes, enforcing accurate brute-force protection.

---

## 2. Worker Partitioning

- **Upgrade**: Add an `organizationId` or `projectId` to the `Worker` model in `schema.prisma`.
- **Value**: Restricts workers to claiming jobs only from queues belonging to their assigned tenant organization, establishing tenant isolation.

---

## 3. Database Sharding & Read Replicas

- **Upgrade**: Configure write/read database splitting. Route queries from metrics and dashboard modules to read-only database replicas.
- **Value**: Keeps heavy read traffic from locking or consuming resources needed by the primary database write connection pool.

---

## 4. Distributed Lock Engine

- **Upgrade**: Implement Redlock (Redis distributed locking) for cron scheduled job promotion loops.
- **Value**: Safely scale to multiple active scheduler nodes without risk of double promotion.
