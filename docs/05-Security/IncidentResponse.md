# Incident Response Procedures

This guide provides steps for responding to security incidents in the Distributed Job Scheduler environment.

## 1. Compromised User Credentials / Stolen Tokens

If a user's account is suspected to be compromised or refresh tokens are leaked:

1. **Revoke Active Refresh Tokens**:
   - Locate the user's ID.
   - You can invalidate all active refresh tokens for the user by adding their corresponding JTIs to the blocklist or changing the user's role/memberships to force token refresh validation to fail.
2. **Password Reset**:
   - Force a password update for the compromised user in the database.
   - This invalidates the old credentials and requires re-registration of active sessions.

---

## 2. Anomalous Worker Behavior (Heartbeat Spoofing / Lockups)

If a worker behaves erratically (e.g. sending abnormal resource metrics or duplicate execution errors):

1. **Deregister Worker**:
   - Trigger worker deregistration using `DELETE /api/v1/workers/:workerId`.
2. **Release Leases**:
   - If a worker has locked active jobs, wait for the lease to expire (typically 30 seconds) or manually invoke the worker recovery endpoint:
   - `POST /api/v1/workers/:workerId/recover`.
   - This releases all active leases associated with the worker and transitions the jobs back to `QUEUED` or `RETRY_PENDING` so other active workers can claim them.

---

## 3. Denial of Service (DoS) / Rate Limiting Spikes

If the service experiences a thundering herd or DoS attack:

1. **Rate Limit Headers**:
   - Inspect API responses for `RateLimit-Remaining` and client IP metadata in the HTTP headers.
2. **IP Blocklist**:
   - If a specific IP is abusing the service, configure firewall rules (e.g. AWS Security Groups, Cloudflare WAF, Nginx blocklist) to drop traffic before it reaches the Express application.
