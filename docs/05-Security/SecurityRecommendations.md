# Security Recommendations

This document outlines key security recommendations and accepted risks for the Distributed Job Scheduler.

## 1. Remaining Accepted Risks

### In-Memory Rate Limiting

- **Risk**: The current rate-limiter utilizes an in-memory store. In a multi-node horizontal scaling configuration, each node tracks limits independently, meaning an attacker could bypass thresholds by distributing requests across nodes.
- **Recommendation**: Swap the default in-memory store in `middlewares/rate-limit.ts` with `rate-limit-redis` to synchronize rate-limiting data across all API instances.

### Shared Worker Topology

- **Risk**: Workers are shared globally across the cluster rather than partitioned explicitly by tenant or organization. A worker could theoretically fetch jobs across queues belonging to different projects if misconfigured.
- **Recommendation**: Implement tag-based authorization in worker claims or explicit worker-to-organization membership rules.

---

## 2. Production Security Hardening Checklist

- **Database Connection Security**: Enforce `sslmode=require` in the PostgreSQL connection string for staging and production environments.
- **WAF Deployment**: Deploy the API behind a Web Application Firewall (WAF) to filter malicious requests, SQL injection patterns, and handle high-volume DDoS mitigation.
- **Secrets Management Vault**: Migrate from plain OS environment variables to a dedicated secret management service (e.g. HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager).
- **Log Aggregation**: Integrate server logs with a centralized, secure log aggregator (e.g. ELK, Datadog) to store tamper-evident audit and request events. Ensure log storage access is audited and restricted to security administrators.
