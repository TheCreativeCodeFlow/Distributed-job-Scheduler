# Observability Architecture Design

**Document Version**: 1.1.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                                 | Author              |
| :------ | :--------- | :---------------------------------------------------------- | :------------------ |
| 1.1.0   | 2026-07-02 | Remediation: PostgreSQL queue ownership & SQL lock claiming | Principal Architect |
| 1.0.0   | 2026-07-02 | Initial release for Architecture Review                     | Principal Architect |

---

## Table of Contents

1. [Logging Architecture](#1-logging-architecture)
2. [Metrics Architecture](#2-metrics-architecture)
3. [Distributed Tracing & Correlation](#3-distributed-tracing--correlation)
4. [Health Check Probes](#4-health-check-probes)

---

## 1. Logging Architecture

- **Structured Output**: All services serialize logs to JSON format.
- **Log Levels**: Standardized levels: `DEBUG`, `INFO`, `WARN`, and `ERROR`.
- **Mandatory Fields**: Every log entry must include:
  - `timestamp`: UTC ISO-8601.
  - `level`: Log level string.
  - `correlation_id`: Context trace ID.
  - `request_id`: Generated at the gateway.
  - `worker_id`: Worker processing the task.
  - `queue_id`: Target queue name.
  - `message`: Log details.
- **Masking**: PII, credentials, passwords, and tokens are scrubbed from logs.

---

## 2. Metrics Architecture

- **Exporter**: Prometheus metrics exporter running at `/metrics` endpoints.
- **Primary Metrics**:
  - `djs_api_requests_total`: Total API requests.
  - `djs_queue_length`: Count of pending tasks (queried from PostgreSQL).
  - `djs_job_execution_duration_seconds`: Histogram of job run times.
  - `djs_worker_heartbeat_failures_total`: Total heartbeat failures.
  - `djs_dlq_insertions_total`: Total jobs moved to the DLQ.

---

## 3. Distributed Tracing & Correlation

- **Correlation ID Propagation**: Generated on the API gateway and passed across boundary contexts:
  - Injected as `X-Correlation-ID` header.
  - Saved in job database records.
  - Propagated to worker execution loops and child job scopes.
- **OpenTelemetry Compatibility**: Core interfaces use OpenTelemetry-compatible tracing abstractions, enabling easy integration with Jaeger or Grafana Tempo in the future.

---

## 4. Health Check Probes

- **`/health` (Liveness)**: Evaluates if the service container is running. Returns 200 OK.
- **`/ready` (Readiness)**: Verifies active connections to PostgreSQL and Redis. If database connections are lost, the probe returns 503, signaling the load balancer to route requests to other nodes.
