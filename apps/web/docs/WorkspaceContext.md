# Workspace Context

This document details organization and project level workspace context filters.

## 1. Workspace Context Persistence

Active organization (`orgId`) and project (`projectId`) IDs are managed inside `useFiltersStore` which leverages local storage persistence.

- Switching organization changes `orgId` and updates the active `projectId` to the new org's default project.

---

## 2. Tenant Filtering Action

Downstream React Query API endpoints read selected workspace values from the Zustand filters store:

- `const { orgId, projectId } = useFiltersStore(state => state.filters);`
- These filters are appended to queries as URL query parameters (e.g. `/api/v1/jobs?orgId=xxx&projectId=yyy`), establishing frontend tenant boundaries.
