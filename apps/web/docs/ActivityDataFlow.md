# Activity Data Flow

This document details query keys and caching for Activity Event lists.

## 1. Query Keys Matrix

- **Activity**: `['activity', 'list']` maps jobs statuses.
- **Timeline**: `['activity', 'timeline']` maps creation timestamps.

---

## 2. In-Memory updates

- Centralized queries are combined in-memory to prevent multiple network calls.
