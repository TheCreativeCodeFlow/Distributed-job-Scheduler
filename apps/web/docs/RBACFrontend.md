# Role-Based Access Control (RBAC)

This document details client-side RBAC checks and path protection policies.

## 1. Path Constraints Mapping

Paths are restricted depending on the user's role:

| Endpoint              | Required Roles                           | Unauthorized Action         |
| :-------------------- | :--------------------------------------- | :-------------------------- |
| `/dashboard/logs`     | `SYSTEM_ADMIN`, `ORG_OWNER`, `ORG_ADMIN` | Redirect to `/unauthorized` |
| `/dashboard/settings` | `SYSTEM_ADMIN`, `ORG_OWNER`, `ORG_ADMIN` | Redirect to `/unauthorized` |
| Other `/dashboard/*`  | All authenticated roles                  | Redirect to `/login`        |

---

## 2. Navigations Filtering

The `Sidebar` component checks if navigation items have `allowedRoles`. If the active role does not match, the item is completely hidden from the sidebar, preventing unauthorized clicks.

- **SYSTEM_ADMIN Bypass**: Users with the `SYSTEM_ADMIN` role bypass all checks and see all options.
