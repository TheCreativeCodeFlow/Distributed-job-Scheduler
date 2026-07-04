'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  Hourglass,
  Zap,
  ShieldAlert,
  Clock,
  GitCommit,
  Database,
  Cpu,
} from 'lucide-react';
import { useJobRetries, useManualRetry } from '../../../../hooks/use-retries';
import { useJob } from '../../../../hooks/use-jobs';
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
import { Countdown } from '../../../../components/scheduled/countdown';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
};

export default function RetryJobDetailsPage() {
  const jobId = useParams<{ jobId: string }>().jobId;
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);

  const [isRetryOpen, setIsRetryOpen] = React.useState(false);

  const jobQuery = useJob(jobId);
  const retriesQuery = useJobRetries(jobId);
  const manualRetryMutation = useManualRetry();

  if (jobQuery.isLoading || retriesQuery.isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Loading job retry parameters..." />
      </DashboardContainer>
    );
  }

  if (
    jobQuery.error ||
    !jobQuery.data ||
    retriesQuery.error ||
    !retriesQuery.data
  ) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Retry details unavailable"
          message="This job has no active retry attempt logs configuration."
          onRetry={() => {
            jobQuery.refetch();
            retriesQuery.refetch();
          }}
        />
      </DashboardContainer>
    );
  }

  const job = jobQuery.data;
  const r = retriesQuery.data;

  const isEligibleForRetry =
    job.status === 'FAILED' ||
    job.status === 'RETRY_PENDING' ||
    job.status === 'RETRY_EXHAUSTED';

  const triggerManualRetry = async () => {
    try {
      await manualRetryMutation.mutateAsync(job.id);
      toast.success(
        'Retry triggered',
        'Job manual retry execution scheduled successfully.',
      );
      setIsRetryOpen(false);
      jobQuery.refetch();
      retriesQuery.refetch();
    } catch {
      toast.error(
        'Retry failed',
        'Could not manual force enqueue job execution.',
      );
      setIsRetryOpen(false);
    }
  };

  return (
    <DashboardContainer>
      <PageHeader
        title={`Retry configurations: Job ${job.id.slice(0, 8)}`}
        description="Inspect backoff metrics, attempt histories, and trigger forced manual retries."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                jobQuery.refetch();
                retriesQuery.refetch();
              }}
              aria-label="Refresh retry details"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {permissions.canOperate && isEligibleForRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRetryOpen(true)}
                disabled={manualRetryMutation.isPending}
              >
                <Zap className="h-4 w-4 text-amber-500" />
                Manual Force Retry
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Link
                href="/dashboard/retries"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to retries
              </Link>
            </Button>
          </div>
        }
      />

      {/* Visual Retry Timeline */}
      <SectionCard title="Retry State transitions timeline" className="mb-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold">
              1
            </div>
            <div>
              <p className="text-sm font-semibold">Queued</p>
              <p className="text-xs text-muted-foreground">
                Enqueued into worker pools
              </p>
            </div>
          </div>

          <div className="hidden h-0.5 flex-1 bg-emerald-500 md:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold">
              2
            </div>
            <div>
              <p className="text-sm font-semibold">Running</p>
              <p className="text-xs text-muted-foreground">
                Executing computational workload
              </p>
            </div>
          </div>

          <div className="hidden h-0.5 flex-1 bg-emerald-500 md:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-500/10 text-rose-400 font-bold">
              3
            </div>
            <div>
              <p className="text-sm font-semibold">Failed</p>
              <p className="text-xs text-muted-foreground">
                Encountered exception logs
              </p>
            </div>
          </div>

          <div
            className={`hidden h-0.5 flex-1 bg-border md:block ${job.status === 'RETRY_PENDING' ? 'bg-amber-500' : ''}`}
          />

          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${
                job.status === 'RETRY_PENDING'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-muted bg-muted/20 text-muted-foreground'
              }`}
            >
              4
            </div>
            <div>
              <p className="text-sm font-semibold">Retry Pending</p>
              <p className="text-xs text-muted-foreground">
                Waiting for backoff timers
              </p>
            </div>
          </div>

          <div
            className={`hidden h-0.5 flex-1 bg-border md:block ${job.status === 'COMPLETED' ? 'bg-emerald-500' : job.status === 'RETRY_EXHAUSTED' ? 'bg-rose-500' : ''}`}
          />

          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${
                ['COMPLETED', 'RETRY_EXHAUSTED'].includes(job.status)
                  ? job.status === 'COMPLETED'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-rose-500 bg-rose-500/10 text-rose-400'
                  : 'border-muted bg-muted/20 text-muted-foreground'
              }`}
            >
              5
            </div>
            <div>
              <p className="text-sm font-semibold">
                {['COMPLETED', 'RETRY_EXHAUSTED'].includes(job.status)
                  ? job.status
                  : 'Outcome'}
              </p>
              <p className="text-xs text-muted-foreground">
                Final execution terminal status
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Failure Alert Box */}
          {r.lastFailureReason && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
              <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive">
                  Last Failure Reason
                </p>
                <p className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-destructive/10 break-all">
                  {r.lastFailureReason}
                </p>
              </div>
            </div>
          )}

          {/* Countdown Clock banner card */}
          {job.status === 'RETRY_PENDING' && r.nextRetryAt && (
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Next Automatic Retry Countdown
                </p>
                <p className="text-sm text-muted-foreground">
                  Time remaining before the scheduler automatically enqueues the
                  job again.
                </p>
              </div>
              <Countdown targetDate={r.nextRetryAt} />
            </div>
          )}

          {/* Attempt history list table logs */}
          <SectionCard title="Attempt Executions History Log">
            {r.attemptsHistory.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No attempt executions logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-xs font-bold uppercase text-muted-foreground">
                      <th className="py-2">Attempt</th>
                      <th className="py-2">Started</th>
                      <th className="py-2">Finished</th>
                      <th className="py-2">Exit Code</th>
                      <th className="py-2">Exception</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.attemptsHistory.map((attempt) => (
                      <tr
                        key={attempt.attemptNumber}
                        className="border-b border-border/40 hover:bg-muted/10 font-mono text-xs"
                      >
                        <td className="py-2.5 font-bold">
                          {attempt.attemptNumber}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {formatDate(attempt.startedAt)}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {formatDate(attempt.finishedAt)}
                        </td>
                        <td
                          className={`py-2.5 font-semibold ${
                            attempt.exitCode === 0
                              ? 'text-emerald-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {attempt.exitCode !== null ? attempt.exitCode : '-'}
                        </td>
                        <td
                          className="py-2.5 text-rose-500 max-w-xs truncate"
                          title={attempt.error || ''}
                        >
                          {attempt.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          <SectionCard title="Backoff Configurations">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Job ID
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold break-all">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {job.id}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Target Queue
                </dt>
                <dd className="mt-1 font-semibold text-foreground">
                  <Link
                    href={`/dashboard/queues/${job.queueId}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <Database className="h-3.5 w-3.5" />
                    {job.queue?.name || job.queueId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Retry Attempts count
                </dt>
                <dd className="mt-1 font-mono text-xs text-foreground font-semibold">
                  {r.retryCount} / {r.maxRetries}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Next Scheduled Retry
                </dt>
                <dd className="mt-1 text-xs text-foreground font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(r.nextRetryAt)}
                </dd>
              </div>
              <hr className="border-border/60" />
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Backoff Strategy
                </dt>
                <dd className="mt-1 text-xs text-foreground font-semibold flex items-center gap-1">
                  <GitCommit className="h-3.5 w-3.5 text-muted-foreground" />
                  {r.strategy}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Backoff Factor
                </dt>
                <dd className="mt-1 font-mono text-xs text-foreground">
                  {r.backoffFactor}s
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Jitter Enabled
                </dt>
                <dd className="mt-1 text-xs font-semibold text-foreground">
                  {r.jitter ? 'Enabled (+/- 10%)' : 'Disabled'}
                </dd>
              </div>
              {job.workerId && (
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Last Leased Worker
                  </dt>
                  <dd className="mt-1 font-semibold">
                    <Link
                      href={`/dashboard/workers/${job.workerId}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Cpu className="h-3.5 w-3.5" />
                      {job.workerId.slice(0, 8)}...
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </SectionCard>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isRetryOpen}
        onClose={() => setIsRetryOpen(false)}
        onConfirm={triggerManualRetry}
        title="Confirm manual retry"
        message="Forcibly clear pending backoff delays and enqueue this failed job for immediate runtime execution?"
        confirmLabel="Retry immediately"
      />
    </DashboardContainer>
  );
}
