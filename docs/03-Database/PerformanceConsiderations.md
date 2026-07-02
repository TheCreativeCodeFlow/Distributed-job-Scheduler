# Database Performance Considerations

This document monitors database query latency and resource usage.

## 1. Connection Management

- Use connection pools limit thresholds in apps.
- Implement statement timeouts for long-running transactions.

## 2. Query Optimization

- Enforce `EXPLAIN ANALYZE` for slow API queries.
- Use composite indexes and partial indexes to optimize complex retrieval paths.
