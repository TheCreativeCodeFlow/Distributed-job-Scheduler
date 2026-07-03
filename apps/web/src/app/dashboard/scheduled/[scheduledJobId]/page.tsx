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
  Database,
  ExternalLink,
  Calendar,
  Hourglass,
} from 'lucide-react';
import {
  useScheduledJob,
  useCancelScheduledJob,
} from '../../../../hooks/use-scheduled-jobs';
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

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function ScheduledJobDetailsPage() {
  const scheduledJobId = useParams<{ scheduledJobId: string }>().scheduledJobId;
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);
  const [isCancelOpen, setIsCancelOpen] = React.useState(false);

  const sjQuery = useScheduledJob(scheduledJobId);
  const cancelScheduled = useCancelScheduledJob();

  if (sjQuery.isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Loading scheduled job telemetry..." />
      </DashboardContainer>
    );
  }

  if (sjQuery.error || !sjQuery.data) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Scheduled job unavailable"
          message="This scheduled job configuration could not be located."
          onRetry={() => sjQuery.refetch()}
        />
      </DashboardContainer>
    );
  }

  const sj = sjQuery.data;
  const job = sj.job;
  const isCancellable = job?.status === 'SCHEDULED';

  const copyId = () => {
    navigator.clipboard.writeText(sj.id);
    toast.success('Copied to clipboard', 'Scheduled Job ID copy successful.');
  };

  const handleCancel = async () => {
    try {
      await cancelScheduled.mutateAsync(sj.id);
      toast.success(
        'Scheduled job cancelled',
        `Scheduled Job ${sj.id.slice(0, 8)} has been cancelled.`,
      );
      setIsCancelOpen(false);
      sjQuery.refetch();
    } catch {
      toast.error('Cancellation failed', 'The request could not be executed.');
      setIsCancelOpen(false);
    }
  };

  return (
    <DashboardContainer>
      <PageHeader
        title={`Scheduled Job details`}
        description={`Inspect delayed promotion config and countdown timers.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job?.status ?? 'SCHEDULED'} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => sjQuery.refetch()}
              aria-label="Refresh details"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={copyId}>
              <Copy className="h-4 w-4" />
              Copy ID
            </Button>
            {permissions.canOperate && isCancellable && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsCancelOpen(true)}
              >
                <Ban className="h-4 w-4" />
                Cancel schedule
              </Button>
            )}
          </div>
        }
      />

      {/* Visual Lifecycle Steps */}
      <SectionCard title="Lifecycle Timeline" className="mb-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold">
              1
            </div>
            <div>
              <p className="text-sm font-semibold">SCHEDULED</p>
              <p className="text-xs text-muted-foreground">
                Execution target set
              </p>
            </div>
          </div>

          <div
            className={`hidden h-0.5 flex-1 bg-border md:block ${job?.status !== 'SCHEDULED' && job?.status !== 'CANCELLED' ? 'bg-emerald-500' : ''}`}
          />

          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${
                job?.status !== 'SCHEDULED' && job?.status !== 'CANCELLED'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-muted bg-muted/20 text-muted-foreground'
              }`}
            >
              2
            </div>
            <div>
              <p className="text-sm font-semibold">QUEUED</p>
              <p className="text-xs text-muted-foreground">Promoted to queue</p>
            </div>
          </div>

          <div
            className={`hidden h-0.5 flex-1 bg-border md:block ${['CLAIMED', 'RUNNING', 'COMPLETED', 'FAILED'].includes(job?.status ?? '') ? 'bg-emerald-500' : ''}`}
          />

          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${
                ['CLAIMED', 'RUNNING', 'COMPLETED', 'FAILED'].includes(
                  job?.status ?? '',
                )
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-muted bg-muted/20 text-muted-foreground'
              }`}
            >
              3
            </div>
            <div>
              <p className="text-sm font-semibold">RUNNING</p>
              <p className="text-xs text-muted-foreground">
                Worker is executing
              </p>
            </div>
          </div>

          <div
            className={`hidden h-0.5 flex-1 bg-border md:block ${['COMPLETED', 'FAILED', 'CANCELLED'].includes(job?.status ?? '') ? 'bg-emerald-500' : ''}`}
          />

          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${
                ['COMPLETED', 'FAILED', 'CANCELLED'].includes(job?.status ?? '')
                  ? job?.status === 'COMPLETED'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : job?.status === 'CANCELLED'
                      ? 'border-gray-500 bg-gray-500/10 text-gray-400'
                      : 'border-rose-500 bg-rose-500/10 text-rose-400'
                  : 'border-muted bg-muted/20 text-muted-foreground'
              }`}
            >
              4
            </div>
            <div>
              <p className="text-sm font-semibold">
                {['COMPLETED', 'FAILED', 'CANCELLED'].includes(
                  job?.status ?? '',
                )
                  ? job?.status
                  : 'FINISHED'}
              </p>
              <p className="text-xs text-muted-foreground">
                Final outcome state
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Countdown timer card */}
          {job?.status === 'SCHEDULED' && (
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Promotion Remaining Countdown
                </p>
                <p className="text-sm text-muted-foreground">
                  Time until the job triggers promotion onto the active worker
                  queue.
                </p>
              </div>
              <Countdown targetDate={sj.nextRunAt} />
            </div>
          )}

          {/* Code viewers */}
          <SectionCard title="Job Payload">
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 font-mono text-xs text-foreground">
              {JSON.stringify(job?.payload ?? {}, null, 2)}
            </pre>
          </SectionCard>

          <SectionCard title="Job Metadata">
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 font-mono text-xs text-foreground">
              {JSON.stringify(job?.metadata ?? {}, null, 2)}
            </pre>
          </SectionCard>
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          <SectionCard title="Scheduling Details">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Scheduled ID
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold break-all text-foreground">
                  {sj.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Promoted Job ID
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold break-all">
                  <Link
                    href={`/dashboard/jobs/${sj.jobId}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {sj.jobId.slice(0, 8)}...
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Target Queue
                </dt>
                <dd className="mt-1 font-semibold">
                  {sj.queue ? (
                    <Link
                      href={`/dashboard/queues/${sj.queueId}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Database className="h-3.5 w-3.5" />
                      {sj.queue.name}
                    </Link>
                  ) : (
                    <span className="font-mono text-xs">{sj.queueId}</span>
                  )}
                </dd>
              </div>
              {sj.project && (
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Project
                  </dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {sj.project.name}
                  </dd>
                </div>
              )}
              {sj.organization && (
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Organization
                  </dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {sj.organization.name}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Scheduled Execution Time
                </dt>
                <dd className="mt-1 text-xs text-foreground font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(sj.nextRunAt)}
                </dd>
              </div>
              {sj.cronExpression && (
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Cron Expression
                  </dt>
                  <dd className="mt-1 font-mono text-xs text-foreground">
                    {sj.cronExpression}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Priority
                </dt>
                <dd className="mt-1 font-mono text-xs text-foreground">
                  {job?.priority ?? 1}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Submitted By
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {job?.submittedBy || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Created
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {formatDate(sj.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Last Updated
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {formatDate(sj.updatedAt)}
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
        title="Cancel Scheduled Job"
        message={`Are you sure you want to cancel the scheduled execution of job ${sj.id.slice(0, 8)}? It will not be promoted to the queue.`}
        confirmLabel="Cancel Schedule"
        isDestructive
      />
    </DashboardContainer>
  );
}
