# Jobs API

This document lists endpoints for scheduling and tracking jobs.

## 1. Endpoints

- `POST /v1/jobs` (schedule new task)
- `GET /v1/jobs` (query tasks list)
- `GET /v1/jobs/:id` (fetch single job status)
- `POST /v1/jobs/:id/cancel` (stop a pending or running job)
- `POST /v1/jobs/:id/retry` (manually retry a failed job)
