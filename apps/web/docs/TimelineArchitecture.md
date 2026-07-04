# Timeline Architecture

This document maps chronological telemetry flows.

```mermaid
graph TD
    DashboardActivity[GET /dashboard/activity] -->|Status transitions| MappedTimeline[Unified Timeline Events]
    DashboardTimeline[GET /dashboard/timeline] -->|Creation events| MappedTimeline
    MappedTimeline -->|Deduplicate & Sort| RenderedTimeline[Timeline list view]
```

- Converts discrete backend status records into a single continuous visual feed.
- Unified structures display execution logs in reverse chronological order.
