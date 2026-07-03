'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, ExternalLink, Calendar, RefreshCw } from 'lucide-react';
import { apiClient } from '../../../services/api-client';
import { useJobs } from '../../../hooks/use-jobs';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { DataTable, Column } from '../../../components/tables/data-table';
import { ErrorState } from '../../../components/feedback/states';
import { JobStatusBadge } from '../../../components/jobs/job-status-badge';
import type { Job, JobStatus } from '../../../types/job';
import type { Project, ProjectOrganization } from '../../../types/project';
import type { Queue } from '../../../types/queue';

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatDuration = (start?: string, end?: string) => {
  if (!start || !end) return '-';
  const duration = new Date(end).getTime() - new Date(start).getTime();
  if (duration < 0) return '0s';
  const seconds = (duration / 1000).toFixed(1);
  return `${seconds}s`;
};

export default function JobsListPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<JobStatus | 'ALL'>('ALL');
  const [projectId, setProjectId] = React.useState('ALL');
  const [queueId, setQueueId] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<
    'createdAt' | 'priority' | 'attempts' | 'status'
  >('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Load projects for filter
  const projectsQuery = useQuery<Project[]>({
    queryKey: ['projects', 'jobs-filter'],
    queryFn: async () => {
      const orgs = (await apiClient.get('/organizations'))
        .data as ProjectOrganization[];
      const groups = await Promise.all(
        orgs.map(async (org) => {
          const projs = (
            await apiClient.get(`/organizations/${org.id}/projects`)
          ).data as Project[];
          return projs.map((p) => ({ ...p, organization: org }));
        }),
      );
      return groups.flat();
    },
  });

  // Load queues for filter
  const queuesQuery = useQuery<Queue[]>({
    queryKey: ['queues', 'jobs-filter', projectId],
    queryFn: async () => {
      if (projectId && projectId !== 'ALL') {
        return (await apiClient.get(`/projects/${projectId}/queues`))
          .data as Queue[];
      }
      const projs = projectsQuery.data ?? [];
      const groups = await Promise.all(
        projs.map(async (p) => {
          const qs = (await apiClient.get(`/projects/${p.id}/queues`))
            .data as Queue[];
          return qs;
        }),
      );
      return groups.flat();
    },
    enabled: Boolean(projectsQuery.data),
  });

  const jobsQuery = useJobs({
    search,
    status: status === 'ALL' ? undefined : status,
    projectId: projectId === 'ALL' ? undefined : projectId,
    queueId: queueId === 'ALL' ? undefined : queueId,
    page,
    limit: 10,
    sortBy,
    sortOrder,
  });

  const columns: Column<Job>[] = [
    {
      key: 'id',
      header: 'Job ID',
      render: (job) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Link
            href={`/dashboard/jobs/${job.id}`}
            className="text-primary hover:underline font-semibold"
          >
            {job.id.slice(0, 8)}...
          </Link>
        </div>
      ),
    },
    {
      key: 'queue',
      header: 'Queue',
      render: (job) => (
        <div className="text-xs">
          {job.queue?.name ? (
            <Link
              href={`/dashboard/queues/${job.queueId}`}
              className="hover:underline font-medium text-foreground"
            >
              {job.queue.name}
            </Link>
          ) : (
            <span className="text-muted-foreground font-mono">
              {job.queueId.slice(0, 8)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (job) => <JobStatusBadge status={job.status} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (job) => (
        <span className="font-mono text-xs">{job.priority}</span>
      ),
    },
    {
      key: 'attempts',
      header: 'Attempts',
      sortable: true,
      render: (job) => (
        <span className="font-mono text-xs">{job.attempts}</span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (job) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(job.createdAt)}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (job) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDuration(job.createdAt, job.updatedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      render: (job) => (
        <Link
          href={`/dashboard/jobs/${job.id}`}
          aria-label={`View ${job.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </Link>
      ),
    },
  ];

  if (jobsQuery.error) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Jobs unavailable"
          message="Could not load the jobs telemetry list."
          onRetry={() => jobsQuery.refetch()}
        />
      </DashboardContainer>
    );
  }

  const projectOptions = [
    { value: 'ALL', label: 'All projects' },
    ...(projectsQuery.data ?? []).map((p) => ({
      value: p.id,
      label: `${p.name} (${p.organization?.name})`,
    })),
  ];

  const queueOptions = [
    { value: 'ALL', label: 'All queues' },
    ...(queuesQuery.data ?? []).map((q) => ({
      value: q.id,
      label: q.name,
    })),
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All states' },
    ...[
      'SCHEDULED',
      'QUEUED',
      'CLAIMED',
      'RUNNING',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
      'DEAD_LETTER',
      'RETRY_PENDING',
      'RETRY_EXHAUSTED',
    ].map((s) => ({
      value: s,
      label: s,
    })),
  ];

  return (
    <DashboardContainer>
      <PageHeader
        title="Jobs"
        description="Inspect, search, and submit processing jobs across active project queues."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => jobsQuery.refetch()}
              aria-label="Refresh jobs"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <Link
                href="/dashboard/jobs/create"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Submit job
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search jobs"
            placeholder="Search by Job ID or parameters..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            aria-label="Project"
            placeholder="Filter project"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setQueueId('ALL');
              setPage(1);
            }}
            options={projectOptions}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            aria-label="Queue"
            placeholder="Filter queue"
            value={queueId}
            onChange={(e) => {
              setQueueId(e.target.value);
              setPage(1);
            }}
            options={queueOptions}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            aria-label="Filter jobs by state"
            placeholder="Filter status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(1);
            }}
            options={statusOptions}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={jobsQuery.data?.items ?? []}
        isLoading={jobsQuery.isLoading}
        getRowId={(job) => job.id}
        emptyMessage="No job executions found matches the current filters."
        pagination={{
          page: jobsQuery.data?.page ?? 1,
          limit: jobsQuery.data?.limit ?? 10,
          totalPages: jobsQuery.data?.totalPages ?? 1,
          total: jobsQuery.data?.total ?? 0,
          onPageChange: (p) => setPage(p),
        }}
        sorting={{
          sortBy,
          sortOrder,
          onSortChange: (key, order) => {
            setSortBy(key as any);
            setSortOrder(order);
          },
        }}
      />
    </DashboardContainer>
  );
}
