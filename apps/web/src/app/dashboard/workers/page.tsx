'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Plus,
  ExternalLink,
  RefreshCw,
  Cpu,
  Activity,
} from 'lucide-react';
import { apiClient } from '../../../services/api-client';
import { useWorkers } from '../../../hooks/use-workers';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { DataTable, Column } from '../../../components/tables/data-table';
import { ErrorState } from '../../../components/feedback/states';
import { Badge } from '../../../components/ui/badge';
import type { Worker, WorkerStatus } from '../../../types/worker';
import type { Queue } from '../../../types/queue';

const formatDate = (value?: string | null) => {
  if (!value) return 'Never';
  const age = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (age < 60) return `${age}s ago`;
  return new Intl.DateTimeFormat(undefined, {
    timeStyle: 'medium',
  }).format(new Date(value));
};

import { WorkerStatusBadge } from '../../../components/workers/worker-status-badge';

export default function WorkerDirectoryPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<string>('ALL');
  const [queueId, setQueueId] = React.useState<string>('ALL');
  const [page, setPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<
    'hostname' | 'lastHeartbeat' | 'createdAt'
  >('hostname');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  // Load all active queues for filtering
  const queuesQuery = useQuery<Queue[]>({
    queryKey: ['queues', 'worker-filters'],
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

  const workersQuery = useWorkers({
    search,
    status: status === 'ALL' ? undefined : (status as WorkerStatus),
    queueId: queueId === 'ALL' ? undefined : queueId,
    page,
    limit: 10,
    sortBy,
    sortOrder,
  });

  const columns: Column<Worker>[] = [
    {
      key: 'hostname',
      header: 'Hostname / Instance',
      render: (w) => (
        <div className="flex flex-col">
          <Link
            href={`/dashboard/workers/${w.id}`}
            className="text-sm font-bold text-foreground hover:underline"
          >
            {w.hostname}
          </Link>
          <span className="font-mono text-[10px] text-muted-foreground">
            {w.instanceId}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (w) => <WorkerStatusBadge status={w.status} />,
    },
    {
      key: 'version',
      header: 'Version',
      render: (w) => (
        <span className="font-mono text-xs text-foreground">{w.version}</span>
      ),
    },
    {
      key: 'concurrency',
      header: 'Capacity Slots',
      render: (w) => {
        const usage = w.activeClaimsCount;
        const total = w.maxConcurrency;
        const percentage = Math.min(100, Math.round((usage / total) * 100));
        return (
          <div className="flex items-center gap-2 max-w-xs">
            <div className="flex-1 h-1.5 w-16 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentage > 85
                    ? 'bg-rose-500'
                    : percentage > 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-mono font-semibold">
              {usage}/{total}
            </span>
          </div>
        );
      },
    },
    {
      key: 'queuesCount',
      header: 'Queues',
      render: (w) => (
        <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground">
          {w.supportedQueues.length}
        </span>
      ),
    },
    {
      key: 'lastHeartbeat',
      header: 'Last Heartbeat',
      sortable: true,
      render: (w) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Activity className="h-3 w-3 text-emerald-500" />
          {formatDate(w.lastHeartbeat)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      render: (w) => (
        <Link
          href={`/dashboard/workers/${w.id}`}
          aria-label={`View worker details ${w.hostname}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </Link>
      ),
    },
  ];

  if (workersQuery.error) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Compute workers telemetry unavailable"
          message="Could not load the system daemon execution nodes table."
          onRetry={() => workersQuery.refetch()}
        />
      </DashboardContainer>
    );
  }

  const statusOptions = [
    { value: 'ALL', label: 'All statuses' },
    ...['REGISTERING', 'IDLE', 'RUNNING', 'LOST', 'RECOVERING', 'OFFLINE'].map(
      (s) => ({
        value: s,
        label: s,
      }),
    ),
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
        title="Compute Workers"
        description="Monitor system daemon running nodes, claim leases, and capacity allocations."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => workersQuery.refetch()}
              aria-label="Refresh workers list"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <Link
                href="/dashboard/workers/register"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Register Worker
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search workers"
            placeholder="Search by hostname, instance ID..."
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
        data={workersQuery.data?.items ?? []}
        isLoading={workersQuery.isLoading}
        getRowId={(w) => w.id}
        emptyMessage="No active compute worker nodes match the current filters."
        pagination={{
          page: workersQuery.data?.page ?? 1,
          limit: workersQuery.data?.limit ?? 10,
          totalPages: workersQuery.data?.totalPages ?? 1,
          total: workersQuery.data?.total ?? 0,
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
