'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Ban,
  Copy,
  RefreshCw,
  Cpu,
  Database,
  Clipboard,
} from 'lucide-react';
import {
  useJob,
  useJobExecutions,
  useCancelJob,
} from '../../../../hooks/use-jobs';
import { useAuth } from '../../../../providers/auth-provider';
import { queuePermissions } from '../../../../lib/queue-state';
import { useToast } from '../../../../components/feedback/toasts';
import { DashboardContainer } from '../../../../components/layout/dashboard-container';
import { PageHeader } from '../../../../components/layout/page-header';
import { SectionCard } from '../../../../components/ui/section-card';
import {
  ErrorState,
  LoadingState,
} from '../../../../components/feedback/states';
import { Button } from '../../../../components/ui/button';
import { ConfirmationModal } from '../../../../components/ui/confirmation-modal';
import { JobStatusBadge } from '../../../../components/jobs/job-status-badge';
import type { JobStatus } from '../../../../types/job';

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

// Returns boolean flags for where in the lifecycle the job currently resides
const getLifecycleState = (status: JobStatus) => {
  const isCompleted = status === 'COMPLETED';
  const isFailed =
    status === 'FAILED' ||
    status === 'DEAD_LETTER' ||
    status === 'RETRY_EXHAUSTED';
  const isCancelled = status === 'CANCELLED';

  return {
    queued: true,
    claimed: [
      'CLAIMED',
      'RUNNING',
      'COMPLETED',
      'FAILED',
      'DEAD_LETTER',
      'RETRY_EXHAUSTED',
      'CANCELLED',
    ].includes(status),
    running: [
      'RUNNING',
      'COMPLETED',
      'FAILED',
      'DEAD_LETTER',
      'RETRY_EXHAUSTED',
    ].includes(status),
    finished: isCompleted || isFailed || isCancelled,
    isCompleted,
    isFailed,
    isCancelled,
  };
};

export default function JobDetailsPage() {
  const jobId = useParams<{ jobId: string }>().jobId;
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);
  const [isCancelOpen, setIsCancelOpen] = React.useState(false);

  const jobQuery = useJob(jobId);
  const executionsQuery = useJobExecutions(jobId);
  const cancelJob = useCancelJob();

  if (jobQuery.isLoading || executionsQuery.isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Loading job telemetry metrics..." />
      </DashboardContainer>
    );
  }

  if (jobQuery.error || !jobQuery.data) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Job unavailable"
          message="This job execution could not be located in active memory."
          onRetry={() => {
            jobQuery.refetch();
            executionsQuery.refetch();
          }}
        />
      </DashboardContainer>
    );
  }

  const job = jobQuery.data;
  const executions = executionsQuery.data ?? [];
  const lifecycle = getLifecycleState(job.status);

  // Job cancellation is valid for active/running states only
  const canCancel = [
    'QUEUED',
    'SCHEDULED',
    'CLAIMED',
    'RUNNING',
    'RETRY_PENDING',
  ].includes(job.status);

  const copyId = () => {
    navigator.clipboard.writeText(job.id);
    toast.success('Copied to clipboard', 'Job ID copy successful.');
  };

  const handleCancel = async () => {
    try {
      await cancelJob.mutateAsync(job.id);
      toast.success(
        'Job cancelled',
        `Job ${job.id.slice(0, 8)} cancellation request submitted.`,
      );
      setIsCancelOpen(false);
      jobQuery.refetch();
      executionsQuery.refetch();
    } catch {
      toast.error('Cancellation failed', 'The request could not be executed.');
      setIsCancelOpen(false);
    }
  };

  return (
    <DashboardContainer>
      <PageHeader
        title={`Job details`}
        description={`Inspect execution status, payload, and historical logs.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => jobQuery.refetch()}
              aria-label="Refresh job details"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={copyId}>
              <Copy className="h-4 w-4" />
              Copy ID
            </Button>
            {permissions.canOperate && canCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsCancelOpen(true)}
              >
                <Ban className="h-4 w-4" />
                Cancel job
              </Button>
            )}
          </div>
        }
      />

      {/* Visual Lifecycle Steps */}
      <SectionCard title="Lifecycle Timeline" className="mb-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:px-8 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${lifecycle.queued ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-muted bg-muted/20 text-muted-foreground'}`}
            >
              1
            </div>
            <div>
              <p className="text-sm font-semibold">QUEUED</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(job.createdAt)}
              </p>
            </div>
          </div>

          <div
            className={`hidden h-0.5 flex-1 bg-border md:block ${lifecycle.claimed ? 'bg-emerald-500' : ''}`}
          />

          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${lifecycle.claimed ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-muted bg-muted/20 text-muted-foreground'}`}
            >
              2
            </div>
            <div>
              <p className="text-sm font-semibold">CLAIMED</p>
              <p className="text-xs text-muted-foreground">
                Picked up by worker
              </p>
            </div>
          </div>

          <div
            className={`hidden h-0.5 flex-1 bg-border md:block ${lifecycle.running ? 'bg-emerald-500' : ''}`}
          />

          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${lifecycle.running ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-muted bg-muted/20 text-muted-foreground'}`}
            >
              3
            </div>
            <div>
              <p className="text-sm font-semibold">RUNNING</p>
              <p className="text-xs text-muted-foreground">Active execution</p>
            </div>
          </div>

          <div
            className={`hidden h-0.5 flex-1 bg-border md:block ${lifecycle.finished ? 'bg-emerald-500' : ''}`}
          />

          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${
                lifecycle.finished
                  ? lifecycle.isCompleted
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : lifecycle.isCancelled
                      ? 'border-gray-500 bg-gray-500/10 text-gray-400'
                      : 'border-rose-500 bg-rose-500/10 text-rose-400'
                  : 'border-muted bg-muted/20 text-muted-foreground'
              }`}
            >
              4
            </div>
            <div>
              <p className="text-sm font-semibold">
                {lifecycle.finished
                  ? lifecycle.isCompleted
                    ? 'COMPLETED'
                    : lifecycle.isCancelled
                      ? 'CANCELLED'
                      : 'FAILED'
                  : 'FINISHED'}
              </p>
              <p className="text-xs text-muted-foreground">
                {lifecycle.finished
                  ? formatDate(job.updatedAt)
                  : 'Pending completion'}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Payload and Metadata Code Viewers */}
          <SectionCard
            title="Job Payload"
            description="Input parameters passed to the executing worker."
          >
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 font-mono text-xs text-foreground">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </SectionCard>

          <SectionCard
            title="Job Metadata"
            description="Audit parameters and tracking fields."
          >
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 font-mono text-xs text-foreground">
              {JSON.stringify(job.metadata, null, 2)}
            </pre>
          </SectionCard>

          {/* Historical Execution Logs */}
          <SectionCard
            title="Execution History"
            description="Historical log outputs and execution metrics recorded by worker nodes."
          >
            {executions.length === 0 ? (
              <p className="text-sm text-muted-foreground font-medium">
                No execution history recorded for this job.
              </p>
            ) : (
              <div className="space-y-4">
                {executions.map((exe) => (
                  <div
                    key={exe.id}
                    className="rounded-lg border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          Execution {exe.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>
                          Duration:{' '}
                          {exe.durationMs
                            ? `${(exe.durationMs / 1000).toFixed(2)}s`
                            : '-'}
                        </span>
                        <span>
                          Exit Code:{' '}
                          {exe.exitCode !== null ? exe.exitCode : '-'}
                        </span>
                      </div>
                    </div>
                    {exe.error && (
                      <div className="rounded border border-rose-500/20 bg-rose-500/5 p-3">
                        <p className="text-xs font-bold text-rose-400">
                          Execution Error
                        </p>
                        <pre className="mt-1 overflow-x-auto font-mono text-[10px] text-rose-300">
                          {JSON.stringify(exe.error, null, 2)}
                        </pre>
                      </div>
                    )}
                    {exe.result && (
                      <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <p className="text-xs font-bold text-emerald-400">
                          Execution Result
                        </p>
                        <pre className="mt-1 overflow-x-auto font-mono text-[10px] text-emerald-300">
                          {JSON.stringify(exe.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <SectionCard title="Job Metadata">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Job ID
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold break-all text-foreground">
                  {job.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Target Queue
                </dt>
                <dd className="mt-1 font-semibold">
                  {job.queue ? (
                    <Link
                      href={`/dashboard/queues/${job.queueId}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Database className="h-3.5 w-3.5" />
                      {job.queue.name}
                    </Link>
                  ) : (
                    <span className="font-mono text-xs">{job.queueId}</span>
                  )}
                </dd>
              </div>
              {job.project && (
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Related Project
                  </dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {job.project.name}
                  </dd>
                </div>
              )}
              {job.organization && (
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Organization
                  </dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {job.organization.name}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Priority
                </dt>
                <dd className="mt-1 font-mono text-xs">{job.priority}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Attempts
                </dt>
                <dd className="mt-1 font-mono text-xs">{job.attempts}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Idempotency Key
                </dt>
                <dd className="mt-1 font-mono text-xs text-muted-foreground break-all">
                  {job.idempotencyKey || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Assigned Worker
                </dt>
                <dd className="mt-1 font-mono text-xs break-all text-foreground">
                  {job.workerId || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Submitted By
                </dt>
                <dd className="mt-1 text-xs break-all text-muted-foreground">
                  {job.submittedBy || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Created
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {formatDate(job.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Last Updated
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {formatDate(job.updatedAt)}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Job"
        message={`Are you sure you want to cancel job ${job.id.slice(0, 8)}? Active worker executions will be terminated.`}
        confirmLabel="Cancel Job"
        isDestructive
      />
    </DashboardContainer>
  );
}
