'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Activity, Gauge, ListTodo, Settings, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../services/api-client';
import {
  useQueue,
  useQueueJobs,
  useQueueStatus,
} from '../../../../hooks/use-queues';
import { useAuth } from '../../../../providers/auth-provider';
import { queuePermissions } from '../../../../lib/queue-state';
import { DashboardContainer } from '../../../../components/layout/dashboard-container';
import { PageHeader } from '../../../../components/layout/page-header';
import {
  ErrorState,
  LoadingState,
} from '../../../../components/feedback/states';
import { Button } from '../../../../components/ui/button';
import { QueueStatus } from '../../../../components/queues/queue-status';
import { QueueControls } from '../../../../components/queues/queue-controls';
import { StatisticGrid } from '../../../../components/layout/statistic-grid';
import { MetricCard } from '../../../../components/charts/metric-card';
import { SectionCard } from '../../../../components/ui/section-card';
import type { Project, ProjectOrganization } from '../../../../types/project';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function QueueDetailsPage() {
  const queueId = useParams<{ queueId: string }>().queueId;
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);
  const queueQuery = useQueue(queueId);
  const statusQuery = useQueueStatus(queueId);
  const jobsQuery = useQueueJobs(queueId);
  const projectQuery = useQuery<Project>({
    queryKey: ['projects', 'detail', queueQuery.data?.projectId],
    queryFn: async () =>
      (await apiClient.get(`/projects/${queueQuery.data!.projectId}`)).data,
    enabled: Boolean(queueQuery.data?.projectId),
  });
  const organizationQuery = useQuery<ProjectOrganization>({
    queryKey: ['organizations', projectQuery.data?.organizationId],
    queryFn: async () =>
      (
        await apiClient.get(
          `/organizations/${projectQuery.data!.organizationId}`,
        )
      ).data,
    enabled: Boolean(projectQuery.data?.organizationId),
  });

  if (queueQuery.isLoading || statusQuery.isLoading || jobsQuery.isLoading)
    return (
      <DashboardContainer>
        <LoadingState message="Loading queue operations…" />
      </DashboardContainer>
    );
  if (
    queueQuery.error ||
    statusQuery.error ||
    jobsQuery.error ||
    !queueQuery.data
  ) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Queue unavailable"
          message="The queue could not be loaded or you no longer have access."
          onRetry={() => {
            queueQuery.refetch();
            statusQuery.refetch();
            jobsQuery.refetch();
          }}
        />
      </DashboardContainer>
    );
  }
  const queue = {
    ...queueQuery.data,
    status: statusQuery.data?.status ?? queueQuery.data.status,
  };
  const metrics = statusQuery.data;
  const metadata = Object.entries(queue.metadata ?? {});
  const recentJobs = [...(jobsQuery.data ?? [])]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 8);

  return (
    <DashboardContainer>
      <PageHeader
        title={queue.name}
        description={queue.description || `Queue slug: ${queue.slug}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <QueueStatus status={queue.status} />
            {permissions.canEditMetadata && (
              <Button variant="outline" size="sm">
                <Link
                  href={`/dashboard/queues/${queue.id}/settings`}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </Button>
            )}
          </div>
        }
      />
      <div className="mb-6">
        <QueueControls queue={queue} canOperate={permissions.canOperate} />
      </div>
      <StatisticGrid>
        <MetricCard
          title="Waiting jobs"
          value={metrics?.waitingJobs ?? 0}
          icon={ListTodo}
          description="Queued, scheduled, or retrying"
        />
        <MetricCard
          title="Running jobs"
          value={metrics?.runningJobs ?? 0}
          icon={Activity}
          description="Claimed or executing"
        />
        <MetricCard
          title="Active workers"
          value={metrics?.activeWorkers ?? 0}
          icon={Users}
          description="Workers supporting this queue"
        />
        <MetricCard
          title="Rate limit"
          value={queue.rateLimit ? `${queue.rateLimit}/s` : 'Unlimited'}
          icon={Gauge}
          description={`Concurrency: ${queue.maxConcurrency}`}
        />
      </StatisticGrid>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Queue information">
            <dl className="grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Project
                </dt>
                <dd className="mt-1 font-semibold">
                  {projectQuery.data?.name ?? 'Loading…'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Organization
                </dt>
                <dd className="mt-1 font-semibold">
                  {organizationQuery.data?.name ?? 'Loading…'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Priority
                </dt>
                <dd className="mt-1">{queue.priority}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Retry policy
                </dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {queue.retryPolicyId}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Created
                </dt>
                <dd className="mt-1">{formatDate(queue.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Updated
                </dt>
                <dd className="mt-1">{formatDate(queue.updatedAt)}</dd>
              </div>
            </dl>
          </SectionCard>
          <SectionCard
            title="Job summary"
            description="Counts are aggregated by the queue status endpoint."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Waiting', metrics?.waitingJobs],
                ['Running', metrics?.runningJobs],
                ['Completed', metrics?.completedJobs],
                ['Failed', metrics?.failedJobs],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{value ?? 0}</p>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Metadata">
            {metadata.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No metadata configured.
              </p>
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2">
                {metadata.map(([key, value]) => (
                  <div key={key} className="rounded-md bg-muted/30 p-3">
                    <dt className="text-xs font-bold text-muted-foreground">
                      {key}
                    </dt>
                    <dd className="mt-1 break-all font-mono text-xs">
                      {JSON.stringify(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </SectionCard>
        </div>
        <SectionCard
          title="Recent activity"
          description="Latest job state changes returned by the backend."
        >
          {recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No job activity recorded.
            </p>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="border-l-2 border-primary/40 pl-3">
                  <p className="text-sm font-semibold">{job.status}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {job.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(job.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardContainer>
  );
}
