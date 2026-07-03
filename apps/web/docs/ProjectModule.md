# Project Management Module

The Project Management module lives under `/dashboard/projects` and provides list,
creation, details, settings, archive, and restore workflows. It uses the shared
dashboard shell, `PageHeader`, `DataTable`, cards, feedback states, and confirmation
dialog.

## Routes

| Route                                      | Purpose                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `/dashboard/projects`                      | Searchable, sortable, filtered project directory                |
| `/dashboard/projects/create`               | Organization-scoped project creation                            |
| `/dashboard/projects/[projectId]`          | Project information, queues, statistics, metadata, and activity |
| `/dashboard/projects/[projectId]/settings` | Role-aware configuration and lifecycle actions                  |

All displayed entity data comes from authenticated API calls. Queue statistics are
derived from the project queue response. Recent activity reflects the project's
backend `createdAt` and `updatedAt` lifecycle timestamps.

## Performance and accessibility

Organization project requests run concurrently. Queue counts are returned by the
organization-project list query, avoiding one request per project. Table loading
uses skeleton rows. Controls have labels, dialogs manage focus through the shared
dialog component, and layouts collapse for narrow screens.
