# Load Testing

## Goal

Validate that the Distributed Job Scheduler sustains steady-state throughput targets without latency degradation.

---

## Scenarios

### Job Submission at Scaled Rates

| Scenario    | Target Rate   | Job Count | Measurement                |
| :---------- | :------------ | :-------- | :------------------------- |
| Low Load    | 10 jobs/sec   | 10        | Latency baseline           |
| Medium Load | 100 jobs/sec  | 30        | Queue insertion throughput |
| High Load   | 1000 jobs/sec | 50        | DB write saturation        |

Each scenario throttles the submission loop to precisely match the target rate using wall-clock timing and measures individual `db.job.create` call latencies.

---

## Metrics Captured

- **Throughput** (ops/sec): Total jobs submitted / total duration
- **P50 Latency**: Median per-operation time in ms
- **P95 Latency**: 95th percentile latency in ms
- **P99 Latency**: Worst-case tail latency in ms
- **Success Rate**: Percentage of operations completing without error
- **Memory RSS**: Node.js resident set size at scenario end

---

## Acceptance Criteria

| Metric        | Threshold                     |
| :------------ | :---------------------------- |
| Success Rate  | 100% at all load levels       |
| P99 Latency   | < 10 ms (mocked DB)           |
| Memory Growth | Stable, no unbounded increase |

---

## File Reference

- **Test**: [`load.perf.test.ts`](file:///Users/rahulseervi/Documents/GitHub/Distributed-job-Scheduler/apps/api/src/tests/performance/load/load.perf.test.ts)
- **Runner**: [`runner.ts`](file:///Users/rahulseervi/Documents/GitHub/Distributed-job-Scheduler/apps/api/src/tests/performance/benchmarks/runner.ts)
