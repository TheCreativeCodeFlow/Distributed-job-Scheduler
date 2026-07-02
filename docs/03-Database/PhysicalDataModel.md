# Physical Data Model Specifications

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Database Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                | Author              |
| :------ | :--------- | :----------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for Database Design Review | Principal Architect |

---

## Table of Contents

1. [Physical Data Characteristics Matrix](#1-physical-data-characteristics-matrix)
2. [Data Operations Analysis](#2-data-operations-analysis)

---

## 1. Physical Data Characteristics Matrix

| Table Name         | Owning Aggregate | Expected Row Growth  | Read Pattern     | Write Pattern        | Retention Policy      | Access Frequency |
| :----------------- | :--------------- | :------------------- | :--------------- | :------------------- | :-------------------- | :--------------- |
| **users**          | Organization     | Low (`< 10k/year`)   | Read Heavy       | Rare Writes          | Permanent             | Low              |
| **organizations**  | Organization     | Low (`< 1k/year`)    | Read Heavy       | Rare Writes          | Permanent             | Low              |
| **projects**       | Project          | Low (`< 5k/year`)    | Read Heavy       | Rare Writes          | Permanent             | Low              |
| **queues**         | Queue            | Low (`< 2k/year`)    | Read Heavy       | Rare Writes          | Permanent             | Medium           |
| **jobs**           | Job              | High (`> 100M/year`) | Medium           | High (Insert/Update) | soft-delete / Archive | High             |
| **job_executions** | Job              | High (`> 200M/year`) | Low (Audit only) | Insert Only          | Archive after 90 days | High             |
| **workers**        | Worker           | Low (`< 50k/year`)   | Read Heavy       | Heartbeat updates    | Cleanup after 1 day   | High             |
| **dead_letter**    | Job              | Medium (`< 1M/year`) | Read Heavy       | Rare Writes          | Delete after 30 days  | Medium           |
| **audit_logs**     | Organization     | High (`> 50M/year`)  | Low              | Insert Only          | Archive after 1 year  | Low              |

---

## 2. Data Operations Analysis

### 2.1. Jobs Table

- **Read Pattern**: Workers query ready jobs using row-level locking.
- **Write Pattern**: Frequent inserts from API gateways, status updates from workers, and state cleaner updates.
- **Retention**: Jobs in `COMPLETED` state are archived after 7 days to prevent database bloating.

### 2.2. Job Executions Table

- **Write Pattern**: Insert-only write profile. Every execution attempt creates a new log row.
- **Archival**: Partitioned monthly, with older partitions archived to S3/Cold storage.
