# Concurrency Audit

This document presents the concurrency audit of the Distributed Job Scheduler, verifying race condition mitigations and atomic operations.

## 1. Duplicate Claiming Prevention

- **Mechanism**: The worker poller claims jobs atomically using transaction blocks. It selects eligible jobs using a `FOR UPDATE SKIP LOCKED` query pattern.
- **Prisma implementation**: Uses transactional writes with atomic update increments to transition the job status from `QUEUED` to `CLAIMED`, registering the worker ownership in the same transaction boundary.
- **Verification**: Tested at extreme worker limits (10 to 1000 concurrent workers), asserting zero duplicate claim rate under race storms.

---

## 2. Duplicate Scheduler Promotion Prevention

- **Mechanism**: The scheduler scans scheduled jobs where `executeAt <= Date.now()` and status is `SCHEDULED`.
- **Mitigation**: Jobs are promoted atomically within database transactions, transitioning the status to `QUEUED` while validating that the pre-state status was strictly `SCHEDULED` (optimistic versioning). This prevents multiple active scheduler instances from promoting the same job.

---

## 3. Lease Expiration Correctness

- **Mechanism**: Worker leases expire if no heartbeat is received within the `expiresAt` lease period (typically 30 seconds).
- **Mitigation**: The worker recovery thread identifies expired leases, terminates their locks, registers the lease state as `EXPIRED`, and resets the jobs back to `QUEUED` or `RETRY_PENDING` atomically. This prevents job orphanages from worker crashes.
- **Race Mitigation**: If a worker heartbeats at the exact moment recovery runs, database write constraints block double state transitions.

---

## 4. Retry Race Conditions

- **Mechanism**: Retry engine increments attempts and schedules the next executions based on exponential backoff calculations.
- **Mitigation**: Database updates execute atomic state checks to prevent duplicate retry triggers if a worker heartbeat times out concurrently with failure reporting.
