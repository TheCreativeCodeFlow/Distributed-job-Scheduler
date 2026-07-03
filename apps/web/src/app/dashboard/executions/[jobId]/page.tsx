'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  Cpu,
  Database,
  Play,
  Clock,
  Code,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useJobExecution } from '../../../../hooks/use-executions';
import { apiClient } from '../../../../services/api-client';
import { DashboardContainer } from '../../../../components/layout/dashboard-container';
import { PageHeader } from '../../../../components/layout/page-header';
import { SectionCard } from '../../../../components/ui/section-card';
import {
  ErrorState,
  LoadingState,
} from '../../../../components/feedback/states';
import { Button } from '../../../../components/ui/button';
import { JobStatusBadge } from '../../../../components/jobs/job-status-badge';
import type { Worker } from '../../../../types/worker';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
};

const formatDuration = (ms?: number | null) => {
  if (ms === undefined || ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export default function ExecutionDetailsPage() {
  const jobId = useParams<{ jobId: string }>().jobId;
  const router = useRouter();

  const executionQuery = useJobExecution(jobId);

  // Load worker details if workerId exists
  const workerId = executionQuery.data?.workerId;
  const workerQuery = useQuery<Worker>({
    queryKey: ['workers', 'detail', workerId],
    queryFn: async () =>
      (await apiClient.get(`/workers/${workerId}`)).data as Worker,
    enabled: Boolean(workerId),
  });

  if (executionQuery.isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Loading runtime execution statistics..." />
      </DashboardContainer>
    );
  }

  if (executionQuery.error || !executionQuery.data) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Execution statistics unavailable"
          message="No active or past executions found for this job ID."
          onRetry={() => executionQuery.refetch()}
        />
      </DashboardContainer>
    );
  }

  const e = executionQuery.data;
  const job = e.job;
  const queue = e.queue;
  const worker = workerQuery.data;

  return (
    <DashboardContainer>
      <PageHeader
        title="Execution Details"
        description="Inspect execution timeline logs, error messages, and output payloads."
        actions={
          <div className="flex items-center gap-2">
            <JobStatusBadge status={e.status as any} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                executionQuery.refetch();
                if (workerId) workerQuery.refetch();
              }}
              aria-label="Refresh execution logs"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Link
                href="/dashboard/executions"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to history
              </Link>
            </Button>
          </div>
        }
      />

      {/* Visual Execution Timeline */}
      <SectionCard title="Execution Lifecycle Steps" className="mb-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold">
              1
            </div>
            <div>
              <p className="text-sm font-semibold">Submitted</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(job?.createdAt)}
              </p>
            </div>
          </div>

          <div className="hidden h-0.5 flex-1 bg-emerald-500 md:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold">
              2
            </div>
            <div>
              <p className="text-sm font-semibold">Claimed</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(e.startedAt)}
              </p>
            </div>
          </div>

          <div className="hidden h-0.5 flex-1 bg-emerald-500 md:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold">
              3
            </div>
            <div>
              <p className="text-sm font-semibold">Running</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(e.startedAt)}
              </p>
            </div>
          </div>

          <div
            className={`hidden h-0.5 flex-1 bg-border md:block ${e.finishedAt ? 'bg-emerald-500' : ''}`}
          />

          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${
                e.finishedAt
                  ? e.status === 'COMPLETED'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-rose-500 bg-rose-500/10 text-rose-400'
                  : 'border-muted bg-muted/20 text-muted-foreground'
              }`}
            >
              4
            </div>
            <div>
              <p className="text-sm font-semibold">
                {e.finishedAt ? e.status : 'Finished'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(e.finishedAt)}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Error Message Panel (if fail) */}
          {e.error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive">
                  Execution Failure Exception
                </p>
                <p className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-destructive/10 break-all">
                  {e.error}
                </p>
              </div>
            </div>
          )}

          {/* Code JSON viewers */}
          <SectionCard title="Execution Result Output">
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 font-mono text-xs text-foreground">
              {JSON.stringify(e.result ?? {}, null, 2)}
            </pre>
          </SectionCard>

          <SectionCard title="Execution Parameters Metadata">
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 font-mono text-xs text-foreground">
              {JSON.stringify(e.metadata ?? {}, null, 2)}
            </pre>
          </SectionCard>
        </div>

        {/* Sidebar Info Panels */}
        <div className="space-y-6">
          <SectionCard title="Inspection Summary">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Execution ID
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold break-all text-foreground">
                  {e.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Related Job ID
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold">
                  <Link
                    href={`/dashboard/jobs/${e.jobId}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {e.jobId.slice(0, 8)}...
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Target Queue
                </dt>
                <dd className="mt-1 font-semibold">
                  {queue ? (
                    <Link
                      href={`/dashboard/queues/${queue.id}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Database className="h-3.5 w-3.5" />
                      {queue.name}
                    </Link>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">
                      {job?.queueId}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Leased Worker
                </dt>
                <dd className="mt-1 font-semibold">
                  {worker ? (
                    <Link
                      href={`/dashboard/workers/${worker.id}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Cpu className="h-3.5 w-3.5" />
                      {worker.hostname}
                    </Link>
                  ) : e.workerId ? (
                    <span className="font-mono text-xs">{e.workerId}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </dd>
              </div>
              <hr className="border-border/60" />
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Started Time
                </dt>
                <dd className="mt-1 text-xs text-foreground font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(e.startedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Finished Time
                </dt>
                <dd className="mt-1 text-xs text-foreground font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(e.finishedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Duration
                </dt>
                <dd className="mt-1 text-xs text-foreground font-bold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDuration(e.duration)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Exit Code
                </dt>
                <dd
                  className={`mt-1 font-mono text-xs font-semibold ${
                    e.exitCode === 0
                      ? 'text-emerald-500'
                      : e.exitCode !== null
                        ? 'text-rose-500'
                        : 'text-muted-foreground'
                  }`}
                >
                  {e.exitCode !== null ? e.exitCode : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Retries Counter
                </dt>
                <dd className="mt-1 font-mono text-xs text-foreground font-semibold">
                  {e.retryCount}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>
    </DashboardContainer>
  );
}
