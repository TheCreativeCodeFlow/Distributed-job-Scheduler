'use client';

import React from 'react';
import Link from 'next/link';
import {
  Archive,
  Building2,
  ExternalLink,
  FolderKanban,
  Plus,
  RotateCcw,
  Search,
  Settings,
} from 'lucide-react';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { DataTable, type Column } from '../../../components/tables/data-table';
import { ErrorState } from '../../../components/feedback/states';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { ConfirmationModal } from '../../../components/ui/confirmation-modal';
import { ProjectStatus } from '../../../components/projects/project-status';
import {
  useArchiveProject,
  useProjects,
  useRestoreProject,
} from '../../../hooks/use-projects';
import { useAuth } from '../../../providers/auth-provider';
import { projectPermissions } from '../../../lib/project-rbac';
import { useToast } from '../../../components/feedback/toasts';
import type { Project, ProjectListParams } from '../../../types/project';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(value),
  );

export default function ProjectsListPage() {
  const { user } = useAuth();
  const permissions = projectPermissions(user?.role);
  const toast = useToast();
  const [filters, setFilters] = React.useState<ProjectListParams>({
    page: 1,
    limit: 10,
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pendingAction, setPendingAction] = React.useState<{
    project: Project;
    action: 'archive' | 'restore';
  } | null>(null);
  const projects = useProjects(filters);
  const archiveProject = useArchiveProject();
  const restoreProject = useRestoreProject();

  const changeFilter = <K extends keyof ProjectListParams>(
    key: K,
    value: ProjectListParams[K],
  ) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  const confirmAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.action === 'archive') {
      await archiveProject.mutateAsync(pendingAction.project);
      toast.success(
        'Project archived',
        `${pendingAction.project.name} is now archived.`,
      );
    } else {
      await restoreProject.mutateAsync(pendingAction.project);
      toast.success(
        'Project restored',
        `${pendingAction.project.name} is active again.`,
      );
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Project',
      sortable: true,
      render: (project) => (
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FolderKanban className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <Link
              className="font-bold hover:text-primary hover:underline"
              href={`/dashboard/projects/${project.id}`}
            >
              {project.name}
            </Link>
            <p className="text-[10px] font-semibold text-muted-foreground">
              {project.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      sortable: true,
      render: (project) => (
        <span className="flex items-center gap-2 text-sm">
          <Building2
            className="h-3.5 w-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          {project.organization?.name}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (project) => <ProjectStatus project={project} />,
    },
    {
      key: 'queueCount',
      header: 'Queues',
      sortable: true,
      render: (project) => project.queueCount ?? 0,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (project) => formatDate(project.createdAt),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (project) => formatDate(project.updatedAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (project) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`View ${project.name}`}
          >
            <Link href={`/dashboard/projects/${project.id}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          {permissions.canEditMetadata && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Settings for ${project.name}`}
            >
              <Link href={`/dashboard/projects/${project.id}/settings`}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {permissions.canArchive && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${project.isArchived ? 'Restore' : 'Archive'} ${project.name}`}
              onClick={() =>
                setPendingAction({
                  project,
                  action: project.isArchived ? 'restore' : 'archive',
                })
              }
            >
              {project.isArchived ? (
                <RotateCcw className="h-4 w-4 text-emerald-500" />
              ) : (
                <Archive className="h-4 w-4 text-amber-500" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardContainer>
      <PageHeader
        title="Projects"
        description="Create, configure, and monitor projects across your organizations."
        actions={
          permissions.canCreate ? (
            <Button size="sm">
              <Link
                className="flex items-center gap-2"
                href="/dashboard/projects/create"
              >
                <Plus className="h-4 w-4" />
                Create project
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search
            className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            aria-label="Search projects"
            placeholder="Search by project, slug, or organization"
            value={filters.search ?? ''}
            onChange={(event) => changeFilter('search', event.target.value)}
          />
        </div>
        <Select
          className="sm:w-44"
          aria-label="Filter projects by status"
          value={filters.status}
          onChange={(event) =>
            changeFilter(
              'status',
              event.target.value as ProjectListParams['status'],
            )
          }
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'archived', label: 'Archived' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      {projects.error ? (
        <ErrorState
          title="Projects unavailable"
          message="The project directory could not be loaded."
          onRetry={() => projects.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={projects.data?.items ?? []}
          isLoading={projects.isLoading}
          getRowId={(project) => project.id}
          emptyMessage="No projects match the current filters."
          pagination={{
            page: projects.data?.page ?? 1,
            limit: projects.data?.limit ?? 10,
            total: projects.data?.total ?? 0,
            totalPages: projects.data?.totalPages ?? 1,
            onPageChange: (page) =>
              setFilters((current) => ({ ...current, page })),
          }}
          sorting={{
            sortBy: filters.sortBy ?? 'createdAt',
            sortOrder: filters.sortOrder ?? 'desc',
            onSortChange: (sortBy, sortOrder) =>
              setFilters((current) => ({
                ...current,
                sortBy: sortBy as ProjectListParams['sortBy'],
                sortOrder,
                page: 1,
              })),
          }}
        />
      )}

      <ConfirmationModal
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmAction}
        title={`${pendingAction?.action === 'restore' ? 'Restore' : 'Archive'} project`}
        message={
          pendingAction?.action === 'restore'
            ? `Restore ${pendingAction.project.name} and make it available again?`
            : `Archive ${pendingAction?.project.name}? Existing configuration is retained.`
        }
        confirmLabel={
          pendingAction?.action === 'restore' ? 'Restore' : 'Archive'
        }
        isDestructive={pendingAction?.action === 'archive'}
      />
    </DashboardContainer>
  );
}
