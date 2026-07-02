# Domain Value Objects

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                           | Author              |
| :------ | :--------- | :------------------------------------ | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Value Objects | Principal Architect |

---

## Table of Contents

1. [Core Domain Value Objects](#1-core-domain-value-objects)
2. [Value Objects Specifications](#2-value-objects-specifications)

---

## 1. Core Domain Value Objects

Value Objects in the domain are immutable, validated structures that carry no identity, defined by their attributes:

- **`CronExpression`**
- **`RetryStrategy`**
- **`ExecutionResult`**
- **`QueueConfiguration`**
- **`WorkerCapabilities`**
- **`JobPayload`**
- **`LeaseDuration`**
- **`Priority`**
- **`ScheduleWindow`**
- **`FailureReason`**
- **`ErrorDetails`**
- **`Metadata`**

---

## 2. Value Objects Specifications

### 2.1. CronExpression

- **Business Meaning**: Standard 5-field time expression for recurring triggers.
- **Fields**: minute, hour, dayOfMonth, month, dayOfWeek.
- **Validation**: Regex matching cron parser syntax guidelines.
- **Equality**: Exact match of string parameters.
- **Immutability**: Read-only once instantiated.

### 2.2. RetryStrategy

- **Business Meaning**: Math backoff rules for failing jobs.
- **Fields**: backoffFactor, maxRetries, retryInterval.
- **Validation**: `maxRetries` between 0 and 10; `backoffFactor` between 1.5 and 5.0.

### 2.3. ExecutionResult

- **Business Meaning**: Logs exit state.
- **Fields**: statusCode (`SUCCESS` or `ERROR`), executionDurationMs, completedAt.
- **Validation**: `executionDurationMs` must be positive.

### 2.4. QueueConfiguration

- **Business Meaning**: Routing parameters.
- **Fields**: maxConcurrency, rateLimitRequests, rateLimitPeriodSeconds.
- **Validation**: Concurrency must be between 1 and 1,000.

### 2.5. WorkerCapabilities

- **Business Meaning**: System capacities worker nodes advertise.
- **Fields**: nodeVersion, osPlatform, maxParallelTasks.
- **Validation**: `maxParallelTasks` must match registry capacity limits.

### 2.6. JobPayload

- **Business Meaning**: Target client parameters of execution.
- **Fields**: jsonObject.
- **Validation**: Must parse as a valid JSON object, size `< 1MB`.

### 2.7. LeaseDuration

- **Business Meaning**: Expiration lock duration.
- **Fields**: durationSeconds.
- **Validation**: Must be between 10 and 600 seconds.

### 2.8. Priority

- **Business Meaning**: Claims index queue channels.
- **Fields**: priorityLevel (`high`, `default`, `low`).
- **Validation**: Restrained to the enum array list.

### 2.9. ScheduleWindow

- **Business Meaning**: Timing buffer checking delayed jobs.
- **Fields**: startTime, endTime.
- **Validation**: `endTime` must be greater than `startTime`.

### 2.10. FailureReason

- **Business Meaning**: Categorized failure labels.
- **Fields**: errorCode, category (`TIMEOUT`, `CRASH`, `APPLICATION`).

### 2.11. ErrorDetails

- **Business Meaning**: Stack trace log entries.
- **Fields**: errorMessage, stackTrace.

### 2.12. Metadata

- **Business Meaning**: Client custom KV tracking maps.
- **Fields**: keyValues (Map).
