# Promotion Lifecycle

This document outlines the scheduled task promotion workflow.

```mermaid
graph TD
    Scheduled[Job Status: SCHEDULED] -->|Next execution reached| Locked[Acquire row lock: Skip locked]
    Locked -->|Update status| Queued[Status: QUEUED]
    Queued -->|Assigned to worker| Running[Running]
```

- Every loop cycle fetches eligible scheduled tasks where executing timestamps are in the past.
- Candidates are promoted by batch updates.
