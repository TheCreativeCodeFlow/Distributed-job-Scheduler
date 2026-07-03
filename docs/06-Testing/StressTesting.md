# Stress & Spike Testing

## Goal

Validate scheduler and API stability under beyond-normal loads and sudden traffic bursts.

---

## Stress Testing — Scheduler Promotion

Simulates the scheduler's promotion loop executing against thousands of eligible delayed jobs.

### Scenario

- **Delayed Job Pool**: 100 jobs per promotion batch, 10 consecutive promotion cycles.
- **Metric Captured**: Promotion throughput (jobs promoted/sec), per-cycle latency (P50/P95/P99).

### Acceptance Criteria

| Metric                   | Threshold         |
| :----------------------- | :---------------- |
| Success Rate             | 100%              |
| Zero failed transactions | Required          |
| Consistent P99           | < 20 ms per cycle |

### File Reference

- **Test**: [`stress.perf.test.ts`](file:///Users/rahulseervi/Documents/GitHub/Distributed-job-Scheduler/apps/api/src/tests/performance/stress/stress.perf.test.ts)

---

## Spike Testing — Queue Creation Burst

Simulates a sudden burst of queue creation requests.

### Scenario

- **Queue Burst**: 30–50 queue creation operations in rapid succession.
- **Metric Captured**: Throughput, latency tail.

### Acceptance Criteria

| Metric                    | Threshold |
| :------------------------ | :-------- |
| Success Rate              | 100%      |
| System remains responsive | Required  |
| No request timeouts       | Required  |

### File Reference

- **Test**: [`spike.perf.test.ts`](file:///Users/rahulseervi/Documents/GitHub/Distributed-job-Scheduler/apps/api/src/tests/performance/spike/spike.perf.test.ts)

---

## Retry Storm Scenario

Simulate thousands of failing jobs exhausting retry policies:

1. Failed jobs trigger `RetryService.handleFailure`.
2. Exponential backoff prevents thundering herd re-queuing.
3. Scheduler promotion picks up `RETRY_PENDING` jobs alongside scheduled ones.
4. Exhausted jobs transition to `RETRY_EXHAUSTED` → DLQ insertion.

**Validated Properties**:

- Backoff math prevents all retried jobs arriving simultaneously.
- DLQ insertions are atomic and isolated per job.
- No zombie jobs remain stuck in `RETRY_PENDING`.
