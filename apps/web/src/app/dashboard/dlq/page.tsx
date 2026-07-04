'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, AlertOctagon, Skull, Eye } from 'lucide-react';
import { apiClient } from '../../../services/api-client';
import { useDlqMetrics, useDlqEntries } from '../../../hooks/use-dlq';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { DataTable, Column } from '../../../components/tables/data-table';
import { ErrorState } from '../../../components/feedback/states';
import { Badge } from '../../../components/ui/badge';
import type { DeadLetterEntry } from '../../../types/dlq';
import type { Queue } from '../../../types/queue';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function DlqDashboardPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [queueId, setQueueId] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<'quarantinedAt' | 'failureReason'>(
    'quarantinedAt',
  );
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  const metricsQuery = useDlqMetrics();

  // Load queues for filters
  const queuesQuery = useQuery<Queue[]>({
    queryKey: ['queues', 'dlq-filter'],
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

  const dlqEntriesQuery = useDlqEntries({
    search,
    status: status === 'ALL' ? undefined : status,
    queueId: queueId === 'ALL' ? undefined : queueId,
    page,
    limit: 10,
    sortBy,
    sortOrder,
  });

  const columns: Column<DeadLetterEntry>[] = [
    {
      key: 'id',
      header: 'Entry ID',
      render: (entry) => (
        <Link
          href={`/dashboard/dlq/${entry.id}`}
          className="font-mono text-xs font-bold text-primary hover:underline"
        >
          {entry.id.slice(0, 8)}...
        </Link>
      ),
    },
    {
      key: 'jobId',
      header: 'Original Job ID',
      render: (entry) => (
        <Link
          href={`/dashboard/jobs/${entry.jobId}`}
          className="font-mono text-xs text-muted-foreground hover:underline"
        >
          {entry.jobId.slice(0, 8)}...
        </Link>
      ),
    },
    {
      key: 'queue',
      header: 'Queue',
      render: (entry) => (
        <div className="text-xs font-semibold text-foreground font-mono">
          {entry.job?.queueId ? entry.job.queueId.slice(0, 8) : '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (entry) => (
        <Badge variant={entry.status === 'ACTIVE' ? 'destructive' : 'success'}>
          {entry.status}
        </Badge>
      ),
    },
    {
      key: 'failureReason',
      header: 'Failure Reason',
      sortable: true,
      render: (entry) => (
        <div
          className="max-w-xs truncate text-xs font-medium text-rose-500"
          title={entry.failureReason}
        >
          {entry.failureReason}
        </div>
      ),
    },
    {
      key: 'quarantinedAt',
      header: 'Quarantined At',
      sortable: true,
      render: (entry) => (
        <span className="text-xs">{formatDate(entry.quarantinedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      render: (entry) => (
        <Link
          href={`/dashboard/dlq/${entry.id}`}
          aria-label={`View details for DLQ entry ${entry.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
        </Link>
      ),
    },
  ];

  if (dlqEntriesQuery.error) {
    return (
      <DashboardContainer>
        <ErrorState
          title="DLQ monitoring unavailable"
          message="Could not load the system dead letter queue recovery logs."
          onRetry={() => dlqEntriesQuery.refetch()}
        />
      </DashboardContainer>
    );
  }

  const metrics = metricsQuery.data ?? {
    totalActive: 0,
    totalReplayed: 0,
  };

  const statusOptions = [
    { value: 'ALL', label: 'All statuses' },
    { value: 'ACTIVE', label: 'ACTIVE' },
    { value: 'REPLAYED', label: 'REPLAYED' },
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
        title="Dead Letter Queue"
        description="Inspect permanently failed jobs, analyze stack errors, replay failures, or purge records."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              metricsQuery.refetch();
              dlqEntriesQuery.refetch();
            }}
            aria-label="Refresh DLQ details"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {/* Metrics Cards Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-500 font-bold uppercase">
              Active DLQ Failures
            </p>
            <p className="text-2xl font-extrabold text-rose-500 mt-1">
              {metrics.totalActive}
            </p>
          </div>
          <AlertOctagon className="h-8 w-8 text-rose-500/40" />
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-500 font-bold uppercase">
              Replayed Failures
            </p>
            <p className="text-2xl font-extrabold text-emerald-500 mt-1">
              {metrics.totalReplayed}
            </p>
          </div>
          <RefreshCw className="h-8 w-8 text-emerald-500/40" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase">
              Total Quarantined
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-1">
              {metrics.totalActive + metrics.totalReplayed}
            </p>
          </div>
          <Skull className="h-8 w-8 text-muted-foreground/40" />
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search DLQ entries"
            placeholder="Search by Entry ID, Job ID..."
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
        data={dlqEntriesQuery.data?.items ?? []}
        isLoading={dlqEntriesQuery.isLoading}
        getRowId={(entry) => entry.id}
        emptyMessage="No dead letter queue entries quarantined."
        pagination={{
          page: dlqEntriesQuery.data?.page ?? 1,
          limit: dlqEntriesQuery.data?.limit ?? 10,
          totalPages: dlqEntriesQuery.data?.totalPages ?? 1,
          total: dlqEntriesQuery.data?.total ?? 0,
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
