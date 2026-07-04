# Replay Workflow

This document details the DLQ entry replay process.

## 1. Cloned job payload

- Creates a new job duplicating priority, payload parameters, queue target, and metadata.
- Sets retry counter back to zero.

---

## 2. Invalidation & updates

- Updates dead letter entry status to `REPLAYED`.
- Invalidate query cache paths to refresh counts and statistics.
