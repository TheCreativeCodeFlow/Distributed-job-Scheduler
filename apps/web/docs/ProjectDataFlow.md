# Project Data Flow

TanStack Query owns server state. `projectKeys` supplies stable list, detail, and
queue cache keys.

## Reads

1. The directory requests `GET /organizations`.
2. It concurrently requests
   `GET /organizations/:organizationId/projects` for accessible organizations.
3. Search, status filtering, sorting, and pagination operate over the returned
   collection because the backend list endpoint does not accept query parameters.
4. Details request `GET /projects/:projectId` and
   `GET /projects/:projectId/queues`; the organization is fetched once after the
   project's `organizationId` is known.

## Writes

Creation posts to the selected organization's project collection. General edits,
metadata, settings, archive, and restore use their dedicated project endpoints.
Successful mutations invalidate project list and detail keys. No lifecycle
mutation is optimistic: preserving confirmed server state is safer for
permission-sensitive archive and restore operations.

The backend organization-project query includes an aggregate queue count. This
keeps the directory free of project-level N+1 requests.
