'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { apiClient } from '../../../services/api-client';
import { useScheduledJobs } from '../../../hooks/use-scheduled-jobs';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { DataTable, Column } from '../../../components/tables/data-table';
import { ErrorState } from '../../../components/feedback/states';
import { JobStatusBadge } from '../../../components/jobs/job-status-badge';
import { Countdown } from '../../../components/scheduled/countdown';
import type { ScheduledJob } from '../../../types/scheduled-job';
import type { Project, ProjectOrganization } from '../../../types/project';
import type { Queue } from '../../../types/queue';

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function ScheduledJobsListPage() {
  const [search, setSearch] = React.useState('');
  const [projectId, setProjectId] = React.useState('ALL');
  const [queueId, setQueueId] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<'createdAt' | 'nextRunAt'>(
    'nextRunAt',
  );
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  // Load projects for filter
  const projectsQuery = useQuery<Project[]>({
    queryKey: ['projects', 'scheduled-filter'],
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
    queryKey: ['queues', 'scheduled-filter', projectId],
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

  const scheduledJobsQuery = useScheduledJobs({
    search,
    projectId: projectId === 'ALL' ? undefined : projectId,
    queueId: queueId === 'ALL' ? undefined : queueId,
    page,
    limit: 10,
    sortBy,
    sortOrder,
  });

  const columns: Column<ScheduledJob>[] = [
    {
      key: 'id',
      header: 'Scheduled ID',
      render: (sj) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Link
            href={`/dashboard/scheduled/${sj.id}`}
            className="text-primary hover:underline font-semibold"
          >
            {sj.id.slice(0, 8)}...
          </Link>
        </div>
      ),
    },
    {
      key: 'jobId',
      header: 'Promoted Job ID',
      render: (sj) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Link
            href={`/dashboard/jobs/${sj.jobId}`}
            className="text-muted-foreground hover:underline"
          >
            {sj.jobId.slice(0, 8)}...
          </Link>
        </div>
      ),
    },
    {
      key: 'queue',
      header: 'Queue',
      render: (sj) => (
        <div className="text-xs">
          {sj.queue?.name ? (
            <Link
              href={`/dashboard/queues/${sj.queueId}`}
              className="hover:underline font-medium text-foreground"
            >
              {sj.queue.name}
            </Link>
          ) : (
            <span className="text-muted-foreground font-mono">
              {sj.queueId.slice(0, 8)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (sj) => <JobStatusBadge status={sj.job?.status ?? 'SCHEDULED'} />,
    },
    {
      key: 'nextRunAt',
      header: 'Scheduled For',
      sortable: true,
      render: (sj) => (
        <span className="text-xs">{formatDate(sj.nextRunAt)}</span>
      ),
    },
    {
      key: 'remaining',
      header: 'Remaining',
      render: (sj) => <Countdown targetDate={sj.nextRunAt} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (sj) => (
        <span className="font-mono text-xs">{sj.job?.priority ?? 1}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      render: (sj) => (
        <Link
          href={`/dashboard/scheduled/${sj.id}`}
          aria-label={`View scheduled job ${sj.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </Link>
      ),
    },
  ];

  if (scheduledJobsQuery.error) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Scheduled jobs unavailable"
          message="Could not load the scheduled delayed jobs telemetry list."
          onRetry={() => scheduledJobsQuery.refetch()}
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

  return (
    <DashboardContainer>
      <PageHeader
        title="Scheduled Jobs"
        description="Inspect, schedule, and cancel delayed jobs."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scheduledJobsQuery.refetch()}
              aria-label="Refresh scheduled jobs"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <Link
                href="/dashboard/scheduled/create"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Schedule job
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search scheduled jobs"
            placeholder="Search by Scheduled ID or targets..."
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
      </div>

      <DataTable
        columns={columns}
        data={scheduledJobsQuery.data?.items ?? []}
        isLoading={scheduledJobsQuery.isLoading}
        getRowId={(sj) => sj.id}
        emptyMessage="No scheduled delayed jobs found matches the current filters."
        pagination={{
          page: scheduledJobsQuery.data?.page ?? 1,
          limit: scheduledJobsQuery.data?.limit ?? 10,
          totalPages: scheduledJobsQuery.data?.totalPages ?? 1,
          total: scheduledJobsQuery.data?.total ?? 0,
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
