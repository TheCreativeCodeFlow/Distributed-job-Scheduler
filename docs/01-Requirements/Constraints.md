# Constraints Specification

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

1. [Technology Stack Constraints](#1-technology-stack-constraints)
2. [Time Limitations](#2-time-limitations)
3. [Scope Limitations](#3-scope-limitations)
4. [Deployment Assumptions](#4-deployment-assumptions)
5. [Resource Assumptions](#5-resource-assumptions)

---

## 1. Technology Stack Constraints

To maintain consistency and simplify operations, all components must use the approved technology stack:

- **Programming Language**: Strict TypeScript (v6.x) compiling to ECMAScript 2022.
- **Runtime Environment**: Node.js LTS (v24.x) running under Linux Alpine-based containers.
- **Package Manager**: pnpm (v10.x) utilizing workspace protocols.
- **Relational Storage**: PostgreSQL (v16.x). Direct SQL scripts must remain standard and ORM queries must execute through Prisma ORM.
- **Queue/Broker Cache**: Redis (v7.x). Use standard Redis commands and transactions.
- **Linter & Formatter**: ESLint flat config layout and Prettier formatter.

## 2. Time Limitations

- The core monorepo foundation, build configurations, and initial test checks must be completed within 1 engineering sprint (2 weeks).
- The end-to-end integration proof-of-concept (running simple jobs from end to end) must deploy to staging by the end of Sprint 2.

## 3. Scope Limitations

- **No Custom Queue Broker**: We must use Redis. Developing custom in-house message brokers or queue backends is prohibited.
- **No Embedded Runtime Executables**: Worker engines must execute Javascript/Typescript payloads using standard Node context. Support for other languages (Python, Go, shell scripts) is out of scope for the initial release.

## 4. Deployment Assumptions

- **Cloud Target**: Designed to run inside containerized platforms (AWS ECS/Fargate, Google Kubernetes Engine).
- **Stateless Application Nodes**: The API and Worker runtimes must store zero state on local disks. Persistent storage must rely on database connections and Redis cache buckets.

## 5. Resource Assumptions

- The project team consists of 3 Full-Stack Engineers and 1 DevOps Specialist.
- Operational infrastructure budgets limit initial production resource configurations to:
  - 1 Primary PostgreSQL Database node and 1 Read replica.
  - 1 Primary Redis Cache node.
  - Up to 10 concurrently running worker container instances.
