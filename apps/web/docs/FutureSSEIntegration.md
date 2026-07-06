# Future SSE Integration

This document outlines how Server-Sent Events will integrate into the framework.

## 1. Event Listeners

- The `EventDispatcher` maps event topic string identifiers directly.
- SSE listeners will register callback functions directly on the dispatch list:
  ```typescript
  globalEventDispatcher.subscribe('job.completed', (data) => {
    // React Query cache invalidate or trigger updates
  });
  ```

---

## 2. Dynamic Refetches

- In the future, we will mount a single SSE connection event source inside `LiveProvider` and parse message payloads directly to publish them.
