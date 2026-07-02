# Domain Queries

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                     | Author              |
| :------ | :--------- | :------------------------------ | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Queries | Principal Architect |

---

## Table of Contents

1. [Core Domain Queries](#1-core-domain-queries)

---

## 1. Core Domain Queries

### 1.1. GetJobStatus

- **Purpose**: Retrieves the execution status and history of a job.
- **Input**: `job_id`.
- **Result**: Job state details, retry count, execution logs, and active lease owner.
- **Possible Failures**: Job not found.

### 1.2. GetQueueMetrics

- **Purpose**: Returns queue length, active workers count, and processing rate.
- **Input**: `queue_id`.
- **Result**: Metrics summary (pending jobs, running jobs, completion throughput).
- **Possible Failures**: Queue not found.

### 1.3. ListActiveWorkers

- **Purpose**: Lists all active registered workers.
- **Input**: None.
- **Result**: List of active workers, concurrency capacities, and registered projects.
- **Possible Failures**: Database timeout.
