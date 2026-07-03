# Navigation Architecture

This document maps the sidebar navigation sections and menu routes.

## 1. Grouped Menu Divisions

Sidebar elements are split into four logical blocks:

- **Core Console**: Overview dashboard, Organizations list, Projects list.
- **Operations**: Queues, Workers, Jobs logs, Job Executions logs.
- **Execution Engine**: Scheduled Jobs, Retry logs, Dead Letter Queue records, Scheduler Engine properties.
- **Telemetry & Admin**: Metrics dashboard, Activity Timeline logs, Settings pages.

---

## 2. Active Route Highlighting

The layout automatically highlights navigation elements on active routes matching segment prefixes:

- `pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))`
- Active items are highlighted using standard `--primary` background gradients and bold font styling.
