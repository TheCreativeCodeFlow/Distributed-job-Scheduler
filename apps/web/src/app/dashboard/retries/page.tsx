'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Database,
} from 'lucide-react';
import { apiClient } from '../../../services/api-client';
import { useRetryMetrics, useRetryJobs } from '../../../hooks/use-retries';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { DataTable, Column } from '../../../components/tables/data-table';
import { ErrorState } from '../../../components/feedback/states';
import { JobStatusBadge } from '../../../components/jobs/job-status-badge';
import { Countdown } from '../../../components/scheduled/countdown';
import type { Job } from '../../../types/job';
import type { Queue } from '../../../types/queue';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function RetryDashboardPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [queueId, setQueueId] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<'createdAt' | 'retryCount'>(
    'createdAt',
  );
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  const metricsQuery = useRetryMetrics();

  // Load queues for filters
  const queuesQuery = useQuery<Queue[]>({
    queryKey: ['queues', 'retries-filter'],
    queryFn: async () => {
      const orgsRes = await apiClient.get('/organizations');
      const orgs = orgsRes.data;
      const groups = await Promise.all(
        orgs.map(async (org: any) => {
          const projs = (
            await apiClient.get(`/organizations/${org.id}/projects`)
          ).data;
          return Promise.all(
            projs.map(async (p: any) => {
              const qs = (await apiClient.get(`/projects/${p.id}/queues`)).data;
              return qs;
            }),
          );
        }),
      );
      return groups.flat(2) as Queue[];
    },
  });

  const retryJobsQuery = useRetryJobs({
    search,
    status: status === 'ALL' ? undefined : status,
    queueId: queueId === 'ALL' ? undefined : queueId,
    page,
    limit: 10,
    sortBy: sortBy === 'retryCount' ? ('attempts' as any) : 'createdAt',
    sortOrder,
  });

  const columns: Column<Job>[] = [
    {
      key: 'id',
      header: 'Job ID',
      render: (job) => (
        <Link
          href={`/dashboard/retries/${job.id}`}
          className="font-mono text-xs font-bold text-primary hover:underline"
        >
          {job.id.slice(0, 8)}...
        </Link>
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
      render: (job) => <JobStatusBadge status={job.status} />,
    },
    {
      key: 'attempts',
      header: 'Retry Attempts',
      sortable: true,
      render: (job) => (
        <span className="font-mono text-xs font-semibold">
          {job.attempts} / {(job as any).maxAttempts ?? 3}
        </span>
      ),
    },
    {
      key: 'nextRetry',
      header: 'Next Retry Time',
      render: (job) => {
        // Next retry time is calculated in backoff schedules
        const detailsQuery = useQuery({
          queryKey: ['retries', 'detail-schedule', job.id],
          queryFn: async () =>
            (await apiClient.get(`/jobs/${job.id}/retries`)).data,
          enabled: job.status === 'RETRY_PENDING',
        });
        if (job.status !== 'RETRY_PENDING')
          return <span className="text-muted-foreground">-</span>;
        if (detailsQuery.isLoading)
          return (
            <span className="text-xs text-muted-foreground">
              Calculating...
            </span>
          );
        return (
          <span className="text-xs">
            {formatDate(detailsQuery.data?.nextRetryAt)}
          </span>
        );
      },
    },
    {
      key: 'countdown',
      header: 'Time Remaining',
      render: (job) => {
        const detailsQuery = useQuery({
          queryKey: ['retries', 'detail-schedule', job.id],
          queryFn: async () =>
            (await apiClient.get(`/jobs/${job.id}/retries`)).data,
          enabled: job.status === 'RETRY_PENDING',
        });
        if (job.status !== 'RETRY_PENDING')
          return <span className="text-muted-foreground">-</span>;
        if (detailsQuery.isLoading || !detailsQuery.data?.nextRetryAt)
          return <span className="text-muted-foreground">-</span>;
        return <Countdown targetDate={detailsQuery.data.nextRetryAt} />;
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      render: (job) => (
        <Link
          href={`/dashboard/retries/${job.id}`}
          aria-label={`View retry details for job ${job.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </Link>
      ),
    },
  ];

  if (retryJobsQuery.error) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Retry monitoring unavailable"
          message="Could not load the system automatic retries logs directory."
          onRetry={() => retryJobsQuery.refetch()}
        />
      </DashboardContainer>
    );
  }

  const metrics = metricsQuery.data ?? {
    totalRetries: 0,
    pendingRetries: 0,
    exhaustedRetries: 0,
    averageAttempts: 0,
    successRate: 0,
  };

  const statusOptions = [
    { value: 'ALL', label: 'All statuses' },
    ...['RETRY_PENDING', 'RETRY_EXHAUSTED', 'FAILED', 'COMPLETED'].map((s) => ({
      value: s,
      label: s,
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
        title="Retry Management"
        description="Inspect automatic retry behavior, backoff calculations, schedules, and success rates."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              metricsQuery.refetch();
              retryJobsQuery.refetch();
            }}
            aria-label="Refresh retry details"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {/* Metrics Cards Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-bold uppercase">
            Total Retries
          </p>
          <p className="text-2xl font-extrabold text-foreground">
            {metrics.totalRetries}
          </p>
        </div>
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 space-y-1">
          <p className="text-xs text-warning font-bold uppercase">
            Pending Retries
          </p>
          <p className="text-2xl font-extrabold text-amber-500">
            {metrics.pendingRetries}
          </p>
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-1">
          <p className="text-xs text-destructive font-bold uppercase">
            Exhausted Retries
          </p>
          <p className="text-2xl font-extrabold text-rose-500">
            {metrics.exhaustedRetries}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-bold uppercase">
            Average Attempts
          </p>
          <p className="text-2xl font-extrabold text-foreground">
            {metrics.averageAttempts.toFixed(1)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
          <p className="text-xs text-emerald-500 font-bold uppercase">
            Success Rate
          </p>
          <p className="text-2xl font-extrabold text-emerald-500">
            {metrics.successRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search retries"
            placeholder="Search by Job ID, Queue..."
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
            aria-label="Status filter"
            placeholder="Filter status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={statusOptions}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            aria-label="Queue filter"
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
        data={retryJobsQuery.data?.items ?? []}
        isLoading={retryJobsQuery.isLoading}
        getRowId={(job) => job.id}
        emptyMessage="No automatic retry tasks matching current filters."
        pagination={{
          page: retryJobsQuery.data?.page ?? 1,
          limit: retryJobsQuery.data?.limit ?? 10,
          totalPages: retryJobsQuery.data?.totalPages ?? 1,
          total: retryJobsQuery.data?.total ?? 0,
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
