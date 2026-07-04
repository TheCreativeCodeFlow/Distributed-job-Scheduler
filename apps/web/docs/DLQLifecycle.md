# DLQ Lifecycle

This document describes the quarantine state transition path.

```mermaid
graph TD
    Running[Running] -->|Attempts Exceeded| Exhausted[Retry Exhausted]
    Exhausted -->|Quarantine Event| Quarantined[Dead Letter: ACTIVE status]
    Quarantined -->|Operator Replay| Replayed[Replayed status: Clones job payload]
    Quarantined -->|Operator Purge| Deleted[Purged and removed]
```

- When a job exhausts all automatic retry slots, it is quarantined inside `DeadLetterEntry` table.
- Entries remain ACTIVE until replayed or purged.
