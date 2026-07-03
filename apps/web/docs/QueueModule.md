# Queue Management Module

This document outlines the Queue Management frontend structure.

## 1. Directory List

- **Queues Index**: Displays active/archived scheduler queues in a sortable `DataTable` including name, slugs, states, concurrency limits, priorities, and count KPIs.
- **Search & Filters**: Local text searches matching queue names and slugs, alongside dropdown filter selectors targeting operational states.

---

## 2. Queue Creation

- Forms capture name, description, priority, max concurrency, rate limit, retry policy ID, and custom metadata entries.
- Generates compliant slugs dynamically on name changes.
