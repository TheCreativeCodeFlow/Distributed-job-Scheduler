# Execution Data Flow

This document details query keys and data management for Execution History.

## 1. Query Key Matrix

- **Executions List**: `['executions', 'list', params]` queries `/dashboard/executions`.
- **Execution Detail**: `['executions', 'detail', jobId]` queries `/jobs/:jobId/execution`.

---

## 2. Parallel Loading Sequences

- Worker descriptions and project-queue scopes are loaded in parallel to populate detail metadata without duplication.
