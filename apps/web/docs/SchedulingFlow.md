# Scheduling Flow

This document details scheduled execution flows and state transitions.

```mermaid
graph TD
    SCHEDULED[SCHEDULED: delayed state] -->|Execution time reached| Promoted[Promoted to Queue]
    Promoted --> QUEUED[QUEUED]
    QUEUED --> CLAIMED[CLAIMED]
    CLAIMED --> RUNNING[RUNNING]
    RUNNING --> COMPLETED[COMPLETED]
    RUNNING --> FAILED[FAILED]
    SCHEDULED -->|Explicit Cancel| CANCELLED[CANCELLED]
```

- Promoted runtime jobs link directly to their parent telemetry configurations.
- Cancel scheduled job actions immediately terminate future executions.
