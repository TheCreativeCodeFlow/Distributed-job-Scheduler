# Job Lifecycle

This document describes the state lifecycle sequences and visual flows of scheduler jobs.

```mermaid
graph TD
    QUEUED[QUEUED: Pending claim] -->|Claimed by Worker| CLAIMED[CLAIMED: Assigned to Worker]
    CLAIMED -->|Starts Processing| RUNNING[RUNNING: Active Execution]
    RUNNING -->|Succeeds| COMPLETED[COMPLETED: Finished cleanly]
    RUNNING -->|Fails / Error| RETRY_PENDING[RETRY_PENDING: Waiting next retry]
    RETRY_PENDING -->|Retries Exhausted| RETRY_EXHAUSTED[RETRY_EXHAUSTED: Retries exceeded]
    RETRY_EXHAUSTED -->|Quarantined| DEAD_LETTER[DEAD_LETTER: DLQ entry]
    RUNNING -->|Fails and no retries| FAILED[FAILED: Terminated with failure]
    QUEUED -->|Explicit Cancel| CANCELLED[CANCELLED: Aborted]
    CLAIMED -->|Explicit Cancel| CANCELLED
    RUNNING -->|Explicit Cancel| CANCELLED
```

- Preceding stages render in successful green styling, while current step highlights blue.
- Terminated final states format according to success (green), failure (red), or cancelled (gray).
