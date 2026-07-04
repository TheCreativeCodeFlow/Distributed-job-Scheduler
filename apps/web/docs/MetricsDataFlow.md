# Metrics Data Flow

This document details query keys and cache strategies for Observability metrics.

## 1. Query Keys

- `['observability', 'queues']`
- `['observability', 'workers']`
- `['observability', 'jobs']`
- `['observability', 'retries']`
- `['observability', 'dlq']`
- `['observability', 'scheduler']`
- `['observability', 'system']`
- `['observability', 'health']`

---

## 2. Shared Caches

- Cached values are shared across dashboard list directories to prevent duplicate requests.
