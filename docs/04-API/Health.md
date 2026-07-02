# Health Check API

This document details load balancer target group probes.

## 1. Endpoints

- `GET /health` (liveness probe; returns 200 OK)
- `GET /ready` (readiness probe; verifies DB/Redis connection states)
