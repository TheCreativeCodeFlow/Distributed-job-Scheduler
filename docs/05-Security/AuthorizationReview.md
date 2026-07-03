# Authorization Review

This document describes the access control hierarchy and tenant isolation enforcement rules.

## 1. Role-Based Access Control (RBAC)

Authorization limits are governed by the `MembershipRole` role hierarchy:

| Role           | Description                                                                            |
| :------------- | :------------------------------------------------------------------------------------- |
| `SYSTEM_ADMIN` | Full administrative control over settings and global metrics.                          |
| `ORG_OWNER`    | Owner of the organization. Can add/remove members and delete projects.                 |
| `ORG_ADMIN`    | Organization administrator. Can manage projects, queues, and view audits.              |
| `DEVELOPER`    | Can submit jobs, poll workers, and view execution stats.                               |
| `READ_ONLY`    | Read-only access to organization dashboard and queues. Cannot submit/modify resources. |

The `requireRoles` middleware checks the `role` claim in the authenticated request context:

```typescript
const middleware = requireRoles('DEVELOPER', 'ORG_OWNER');
```

---

## 2. Tenant Isolation

- **Organization Boundaries**: All projects belong to an organization. Users must have a valid membership record (`OrganizationMember`) in the organization to fetch its projects or child queues.
- **Queue Separation**: Queues exist within a project. Job submissions reference a specific `queueId` which resolves to its parent project/organization to check permissions.
- **Worker Execution Scopes**: Workers claim jobs using queue identifiers. Jobs are associated with a single worker ID while `CLAIMED` or `RUNNING`. Attempting execution actions on another worker's job throws a `ValidationError`.
