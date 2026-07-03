'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, Plus, Search, Settings } from 'lucide-react';
import { useQueues } from '../../../hooks/use-queues';
import { useAuth } from '../../../providers/auth-provider';
import { queuePermissions } from '../../../lib/queue-state';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { DataTable, type Column } from '../../../components/tables/data-table';
import { ErrorState } from '../../../components/feedback/states';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { QueueStatus } from '../../../components/queues/queue-status';
import { QueueControls } from '../../../components/queues/queue-controls';
import type {
  Queue,
  QueueListParams,
  QueueStatus as Status,
} from '../../../types/queue';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(value),
  );

export default function QueuesPage() {
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);
  const [params, setParams] = React.useState<QueueListParams>({
    page: 1,
    limit: 10,
    status: 'ALL',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const queues = useQueues(params);
  const filter = <K extends keyof QueueListParams>(
    key: K,
    value: QueueListParams[K],
  ) => setParams((current) => ({ ...current, [key]: value, page: 1 }));

  const columns: Column<Queue>[] = [
    {
      key: 'name',
      header: 'Queue',
      sortable: true,
      render: (queue) => (
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <Layers className="h-4 w-4" />
          </span>
          <div>
            <Link
              href={`/dashboard/queues/${queue.id}`}
              className="font-bold hover:text-primary hover:underline"
            >
              {queue.name}
            </Link>
            <p className="text-[10px] text-muted-foreground">{queue.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Project / Organization',
      sortable: true,
      render: (queue) => (
        <div>
          <p>{queue.project?.name}</p>
          <p className="text-xs text-muted-foreground">
            {queue.organization?.name}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'State',
      sortable: true,
      render: (queue) => <QueueStatus status={queue.status} />,
    },
    { key: 'priority', header: 'Priority', sortable: true },
    {
      key: 'waitingJobs',
      header: 'Waiting',
      sortable: true,
      render: (queue) => queue.waitingJobs ?? '—',
    },
    {
      key: 'runningJobs',
      header: 'Running',
      render: (queue) => queue.runningJobs ?? '—',
    },
    {
      key: 'rateLimit',
      header: 'Rate limit',
      render: (queue) =>
        queue.rateLimit ? `${queue.rateLimit}/s` : 'Unlimited',
    },
    {
      key: 'activeWorkers',
      header: 'Workers',
      render: (queue) => queue.activeWorkers ?? '—',
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (queue) => formatDate(queue.updatedAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (queue) => (
        <div className="flex items-center gap-1">
          {permissions.canEditMetadata && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Settings for ${queue.name}`}
            >
              <Link href={`/dashboard/queues/${queue.id}/settings`}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <QueueControls
            queue={queue}
            canOperate={permissions.canOperate}
            compact
          />
        </div>
      ),
    },
  ];

  return (
    <DashboardContainer>
      <PageHeader
        title="Queues"
        description="Monitor queue health, workload, and operational state."
        actions={
          permissions.canCreate ? (
            <Button size="sm">
              <Link
                href="/dashboard/queues/create"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create queue
              </Link>
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            aria-label="Search queues"
            placeholder="Search queue, project, or organization"
            value={params.search ?? ''}
            onChange={(event) => filter('search', event.target.value)}
          />
        </div>
        <Select
          aria-label="Filter queues by state"
          className="sm:w-44"
          value={params.status}
          onChange={(event) =>
            filter('status', event.target.value as Status | 'ALL')
          }
          options={[
            'ALL',
            'ACTIVE',
            'PAUSED',
            'DRAINING',
            'DISABLED',
            'ARCHIVED',
          ].map((status) => ({
            value: status,
            label: status === 'ALL' ? 'All states' : status,
          }))}
        />
      </div>
      {queues.error ? (
        <ErrorState
          title="Queues unavailable"
          message="The queue directory could not be loaded."
          onRetry={() => queues.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={queues.data?.items ?? []}
          isLoading={queues.isLoading}
          getRowId={(queue) => queue.id}
          emptyMessage="No queues match the current filters."
          pagination={{
            page: queues.data?.page ?? 1,
            limit: queues.data?.limit ?? 10,
            total: queues.data?.total ?? 0,
            totalPages: queues.data?.totalPages ?? 1,
            onPageChange: (page) =>
              setParams((current) => ({ ...current, page })),
          }}
          sorting={{
            sortBy: params.sortBy ?? 'updatedAt',
            sortOrder: params.sortOrder ?? 'desc',
            onSortChange: (sortBy, sortOrder) =>
              setParams((current) => ({
                ...current,
                sortBy: sortBy as QueueListParams['sortBy'],
                sortOrder,
                page: 1,
              })),
          }}
        />
      )}
    </DashboardContainer>
  );
}
