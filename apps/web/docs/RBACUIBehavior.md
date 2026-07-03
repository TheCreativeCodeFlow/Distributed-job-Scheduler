# RBAC UI Behavior in Organizations

This document details client role-based restrictions inside the organization panel.

## 1. Action Visibility Matrix

Role mappings restrict modifications inside the organization settings screens:

| Action         | Allowed Roles                            | UI Behavior            |
| :------------- | :--------------------------------------- | :--------------------- |
| Create Org     | `SYSTEM_ADMIN`, `ORG_OWNER`              | Hide action buttons    |
| Update Profile | `SYSTEM_ADMIN`, `ORG_OWNER`, `ORG_ADMIN` | Read-only input fields |
| Transfer Owner | `SYSTEM_ADMIN`, `ORG_OWNER`              | Hide transfer blocks   |
| Suspend Tenant | `SYSTEM_ADMIN`, `ORG_OWNER`              | Disable toggle buttons |
| Soft Delete    | `SYSTEM_ADMIN`, `ORG_OWNER`              | Hide action buttons    |

---

## 2. API Level Fallbacks

- Frontend restrictions mirror backend validation gates. If a user bypasses client visibility controls, Axios catches HTTP 403 authorization failures, displaying security error details to the operator.
