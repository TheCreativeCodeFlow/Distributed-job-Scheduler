# Load Testing

This document details load testing procedures for API ingestion routes.

## 1. Targets

- Ingestion API target throughput: >5,000 req/sec under 100ms latency.
- Worker scheduling execution latency: <500ms from enqueue.

## 2. Tooling

- Use k6 scripts to simulate concurrent clients scheduling jobs.
- Run load checks in dedicated staging sandbox systems.
