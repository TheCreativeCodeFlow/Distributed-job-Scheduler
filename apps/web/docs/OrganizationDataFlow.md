# Organization Data Flow

This document details query definitions driving organization details page blocks.

## 1. Directory Queries

- **List Directory**: `['organizations']` fetches `/organizations` details.
- **Org Focus details**: `['organizations', organizationId]` fetches `/organizations/:id` credentials.
- **Statistics details**: `['organizations', organizationId, 'statistics']` fetches `/organizations/:id/statistics` counters.
- **Activity log details**: `['organizations', organizationId, 'activity']` fetches `/organizations/:id/activity` arrays.

---

## 2. Admin Mutations

- **Creation details**: `POST /organizations` resets index query caches.
- **Update Profile details**: `PATCH /organizations/:id` refreshes focus details caches.
- **Suspension / Delete details**: Updates cache state keys and redirects users.
