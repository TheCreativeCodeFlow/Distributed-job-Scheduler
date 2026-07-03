# Execution Timeline

This document details runtime job state transition lines.

```mermaid
graph TD
    Submitted[Submitted: registered configuration] -->|Lease Claim| Claimed[Claimed: assigned to worker]
    Claimed --> Running[Running: active worker computation]
    Running --> Completed[Completed: exit code 0 success]
    Running --> Failed[Failed: non-zero exit error]
```

- Timestamps for every lifecycle transition are recorded and displayed chronologically.
- Timing summaries compute active execution processing duration.
