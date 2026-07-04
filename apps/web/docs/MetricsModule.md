# Metrics Module

This document outlines the Metrics & Observability Center.

## 1. Metrics Collection

- Pulls system gauges and telemetry from mounted endpoints: `/metrics/jobs`, `/metrics/queues`, `/metrics/workers`, `/metrics/system`.
- Combines stats into a centralized operator cockpit dashboard.

---

## 2. In-Memory Charts

- Progress bars and status distribution metrics visualize task counts, scheduler loop latencies, and backoff loads.
