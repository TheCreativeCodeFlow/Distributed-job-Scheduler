'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  RefreshCw,
  ExternalLink,
  Cpu,
  Activity,
  Database,
} from 'lucide-react';
import { apiClient } from '../../../services/api-client';
import { useExecutions } from '../../../hooks/use-executions';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { DataTable, Column } from '../../../components/tables/data-table';
import { ErrorState } from '../../../components/feedback/states';
import { JobStatusBadge } from '../../../components/jobs/job-status-badge';
import type { Execution, ExecutionStatus } from '../../../types/execution';
import type { Worker } from '../../../types/worker';
import type { Queue } from '../../../types/queue';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatDuration = (ms?: number | null) => {
  if (ms === undefined || ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export default function ExecutionListPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<string>('ALL');
  const [workerId, setWorkerId] = React.useState<string>('ALL');
  const [queueId, setQueueId] = React.useState<string>('ALL');
  const [page, setPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<'startedAt' | 'duration'>(
    'startedAt',
  );
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Load workers for filters
  const workersQuery = useQuery<Worker[]>({
    queryKey: ['workers', 'executions-filter'],
    queryFn: async () => (await apiClient.get('/workers')).data as Worker[],
  });

  // Load queues for filters
  const queuesQuery = useQuery<Queue[]>({
    queryKey: ['queues', 'executions-filter'],
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

  const executionsQuery = useExecutions({
    search,
    status: status === 'ALL' ? undefined : (status as ExecutionStatus),
    workerId: workerId === 'ALL' ? undefined : workerId,
    queueId: queueId === 'ALL' ? undefined : queueId,
    page,
    limit: 10,
    sortBy,
    sortOrder,
  });

  const columns: Column<Execution>[] = [
    {
      key: 'id',
      header: 'Execution ID',
      render: (e) => (
        <span className="font-mono text-xs text-muted-foreground select-all break-all">
          {e.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: 'jobId',
      header: 'Job ID',
      render: (e) => (
        <Link
          href={`/dashboard/executions/${e.jobId}`}
          className="font-mono text-xs font-bold text-primary hover:underline"
        >
          {e.jobId.slice(0, 8)}...
        </Link>
      ),
    },
    {
      key: 'queue',
      header: 'Queue',
      render: (e) => (
        <span className="text-xs font-semibold text-foreground">
          {e.job?.queue?.name ? (
            <Link
              href={`/dashboard/queues/${e.job.queueId}`}
              className="hover:underline flex items-center gap-1"
            >
              <Database className="h-3 w-3 text-muted-foreground" />
              {e.job.queue.name}
            </Link>
          ) : (
            <span className="text-muted-foreground font-mono">
              {e.job?.queueId?.slice(0, 8) || '-'}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'worker',
      header: 'Worker',
      render: (e) => (
        <span className="text-xs font-semibold text-foreground">
          {e.workerId ? (
            <Link
              href={`/dashboard/workers/${e.workerId}`}
              className="hover:underline flex items-center gap-1"
            >
              <Cpu className="h-3 w-3 text-muted-foreground" />
              {e.workerId.slice(0, 8)}...
            </Link>
          ) : (
            '-'
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <JobStatusBadge status={e.status as any} />,
    },
    {
      key: 'startedAt',
      header: 'Started At',
      sortable: true,
      render: (e) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(e.startedAt)}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      render: (e) => (
        <span className="font-mono text-xs">{formatDuration(e.duration)}</span>
      ),
    },
    {
      key: 'exitCode',
      header: 'Exit Code',
      render: (e) => (
        <span
          className={`font-mono text-xs font-semibold ${
            e.exitCode === 0
              ? 'text-emerald-500'
              : e.exitCode !== null
                ? 'text-rose-500'
                : 'text-muted-foreground'
          }`}
        >
          {e.exitCode !== null ? e.exitCode : '-'}
        </span>
      ),
    },
    {
      key: 'retryCount',
      header: 'Retries',
      render: (e) => <span className="font-mono text-xs">{e.retryCount}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      render: (e) => (
        <Link
          href={`/dashboard/executions/${e.jobId}`}
          aria-label={`View execution details ${e.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </Link>
      ),
    },
  ];

  if (executionsQuery.error) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Executions history unavailable"
          message="Could not load the runtime executions history logs."
          onRetry={() => executionsQuery.refetch()}
        />
      </DashboardContainer>
    );
  }

  const statusOptions = [
    { value: 'ALL', label: 'All statuses' },
    ...['CLAIMED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].map((s) => ({
      value: s,
      label: s,
    })),
  ];

  const workerOptions = [
    { value: 'ALL', label: 'All workers' },
    ...(workersQuery.data ?? []).map((w) => ({
      value: w.id,
      label: w.hostname,
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
        title="Execution History"
        description="Inspect completed and failed executions, review exit codes, and timing logs."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => executionsQuery.refetch()}
            aria-label="Refresh executions"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search executions"
            placeholder="Search by Execution ID, Job ID..."
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
            aria-label="Worker filter"
            placeholder="Filter worker"
            value={workerId}
            onChange={(e) => {
              setWorkerId(e.target.value);
              setPage(1);
            }}
            options={workerOptions}
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
        data={executionsQuery.data?.items ?? []}
        isLoading={executionsQuery.isLoading}
        getRowId={(e) => e.id}
        emptyMessage="No runtime execution logs found matches the current filters."
        pagination={{
          page: executionsQuery.data?.page ?? 1,
          limit: executionsQuery.data?.limit ?? 10,
          totalPages: executionsQuery.data?.totalPages ?? 1,
          total: executionsQuery.data?.total ?? 0,
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
