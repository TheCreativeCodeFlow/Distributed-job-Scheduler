# Assumptions Specification

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                             | Author              |
| :------ | :--------- | :-------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for Architecture Review | Principal Architect |

---

## Table of Contents

1. [Infrastructure](#1-infrastructure)
2. [Network](#2-network)
3. [Database](#3-database)
4. [Redis](#4-redis)
5. [Authentication](#5-authentication)
6. [Worker Deployment](#6-worker-deployment)
7. [Scheduling](#7-scheduling)
8. [Time Synchronization](#8-time-synchronization)
9. [Environment](#9-environment)

---

## 1. Infrastructure

- **Containerized Environments**: We assume all environments (development, staging, production) host services inside Docker or OCI-compliant container systems.
- **Compute Sizing**: Worker nodes are assumed to have stable, dedicated CPU allocations (non-burstable) to prevent thread execution latency.

## 2. Network

- **Sub-Millisecond Queue Latency**: We assume the network latency between API servers, worker daemons, and the Redis broker is `< 2ms` (nodes are located within the same cloud availability zone).
- **Persistent TCP Keep-Alive**: We assume that internal connection networks maintain TCP keep-alive states without dropouts.

## 3. Database

- **Connection Pool Capacity**: We assume the PostgreSQL database allows up to `200` concurrent connections per API node and `100` per worker pool.
- **Transactional Consistency**: We assume PostgreSQL runs with `Read Committed` isolation level.

## 4. Redis

- **In-Memory Volatility**: We assume Redis has persistence configured (AOF and RDB) to prevent task state loss during Redis node reboots.
- **Lock Eviction**: We assume Redis keys eviction policy is set to `noeviction`. This ensures Redis does not delete active queue items or lease keys if memory limit bounds are reached.

## 5. Authentication

- **External Identity Provider (IdP)**: We assume that the JWT keys used to verify tokens are regularly rotated and public key sets are accessible via standard JWKS endpoints.

## 6. Worker Deployment

- **State Independence**: Worker nodes do not store local execution state on disk. If a worker container crashes, any active task is reassigned to another node.

## 7. Scheduling

- **Lock Availability**: We assume that distributed lock implementations (e.g. Redlock algorithm using Redis) are used to synchronize cron enqueuing across multiple scheduler API nodes.

## 8. Time Synchronization

- **Universal Time Coordinated (UTC)**: All nodes (host machines, containers, database rows) operate strictly on the UTC timezone.
- **NTP Sync**: All machines sync clocks via Network Time Protocol (NTP). We assume clock skew across all machines is `< 50ms`.

## 9. Environment

- **Configuration Injection**: Environment parameters are assumed to be injected using container context variables (12-Factor App design pattern), rather than compiled into build packages.
