# Overview Components Reference

This document maps the layout widgets driving the home screen.

## 1. SystemHealth Component

Displays critical infrastructure connection details:

- **databaseStatus**: PostgreSQL connectivity.
- **redisStatus**: Redis connection.
- **schedulerStatus**: Scheduler loop execution indicator.
- **workerAvailability**: Active workers status.

---

## 2. ActivityFeed Component

Displays recent jobs list:

- Chronological timeline events list sorted by `updatedAt` field.
- Renders corresponding badge colors (Green: Completed, Red: Failed, Amber: Retry Pending, Sky: Running).
