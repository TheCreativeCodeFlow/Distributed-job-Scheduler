# Real-time Cache Synchronization

How backend events invalidate React Query cache keys selectively.

## Selective Cache Invalidation Map

To avoid global invalidation (which causes unnecessary network traffic), events trigger invalidations for specific query keys only:

| Event                           | Invalidation Keys                                        |
| ------------------------------- | -------------------------------------------------------- |
| `JobCompleted`, `JobFailed`     | `jobs`, `dashboard`, `metrics`, `executions`, `activity` |
| `WorkerHeartbeat`, `WorkerLost` | `workers`, `dashboard`, `metrics`                        |
| `QueuePaused`, `QueueResumed`   | `queues`, `dashboard`, `activity`                        |
| `RetryExhausted`                | `retries`, `dlq`, `activity`, `metrics`                  |
| `DeadLetterReplayed`            | `dlq`, `jobs`, `activity`                                |

## Deduplication & Throttling

Identical event bursts are throttled (500ms window) by `SSEClient` before dispatch to avoid browser CPU spikes.
All query invalidations go through `globalRefreshManager` to trigger refetches for visible components only.
