'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  FileCode,
  Play,
  Trash2,
  ShieldAlert,
  Cpu,
  Database,
  ExternalLink,
} from 'lucide-react';
import {
  useDlqEntry,
  useReplayEntry,
  usePurgeEntry,
} from '../../../../hooks/use-dlq';
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
import { Badge } from '../../../../components/ui/badge';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
};

export default function DlqEntryDetailsPage() {
  const entryId = useParams<{ entryId: string }>().entryId;
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);

  const [isReplayOpen, setIsReplayOpen] = React.useState(false);
  const [isPurgeOpen, setIsPurgeOpen] = React.useState(false);

  const entryQuery = useDlqEntry(entryId);
  const replayMutation = useReplayEntry();
  const purgeMutation = usePurgeEntry();

  if (entryQuery.isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Loading quarantined DLQ logs..." />
      </DashboardContainer>
    );
  }

  if (entryQuery.error || !entryQuery.data) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Quarantined entry details unavailable"
          message="No active or past DLQ entry logs found matching this identifier."
          onRetry={() => entryQuery.refetch()}
        />
      </DashboardContainer>
    );
  }

  const e = entryQuery.data;
  const job = e.job;

  const triggerReplay = async () => {
    try {
      await replayMutation.mutateAsync(e.id);
      toast.success(
        'DLQ Entry Replayed',
        'The permanently failed job has been cloned and queued successfully.',
      );
      setIsReplayOpen(false);
      entryQuery.refetch();
    } catch {
      toast.error(
        'Replay failed',
        'Could not clone and enqueue dead letter entry.',
      );
      setIsReplayOpen(false);
    }
  };

  const triggerPurge = async () => {
    try {
      await purgeMutation.mutateAsync(e.id);
      toast.success(
        'DLQ Entry Purged',
        'Dead letter log entry has been permanently deleted.',
      );
      setIsPurgeOpen(false);
      router.push('/dashboard/dlq');
    } catch {
      toast.error(
        'Purge failed',
        'Could not permanently purge entry from dead letter lists.',
      );
      setIsPurgeOpen(false);
    }
  };

  return (
    <DashboardContainer>
      <PageHeader
        title={`DLQ Entry Details: ${e.id.slice(0, 8)}`}
        description="Inspect stack error logs, payloads, metadata, and execute manual replays or purges."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={e.status === 'ACTIVE' ? 'destructive' : 'success'}>
              {e.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => entryQuery.refetch()}
              aria-label="Refresh DLQ details"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {permissions.canOperate && e.status === 'ACTIVE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReplayOpen(true)}
                disabled={replayMutation.isPending}
              >
                <Play className="h-4 w-4 text-emerald-500" />
                Replay Failure
              </Button>
            )}
            {permissions.canOperate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPurgeOpen(true)}
                disabled={purgeMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-rose-500" />
                Purge Record
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Link href="/dashboard/dlq" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to DLQ
              </Link>
            </Button>
          </div>
        }
      />

      {/* Visual Timeline component */}
      <SectionCard title="Lifecycle Timeline to Quarantine" className="mb-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold">
              1
            </div>
            <div>
              <p className="text-sm font-semibold">Queued</p>
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
              <p className="text-sm font-semibold">Running</p>
              <p className="text-xs text-muted-foreground">
                Executing attempts
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
                Retry pending / backoff
              </p>
            </div>
          </div>

          <div className="hidden h-0.5 flex-1 bg-rose-500 md:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-500/10 text-rose-400 font-bold">
              4
            </div>
            <div>
              <p className="text-sm font-semibold">Exhausted</p>
              <p className="text-xs text-muted-foreground">Retries exhausted</p>
            </div>
          </div>

          <div className="hidden h-0.5 flex-1 bg-rose-500 md:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-500/10 text-rose-400 font-bold">
              5
            </div>
            <div>
              <p className="text-sm font-semibold">Dead Letter</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(e.quarantinedAt)}
              </p>
            </div>
          </div>

          {e.status === 'REPLAYED' && (
            <>
              <div className="hidden h-0.5 flex-1 bg-emerald-500 md:block" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold">
                  6
                </div>
                <div>
                  <p className="text-sm font-semibold">Replayed</p>
                  <p className="text-xs text-muted-foreground">
                    New execution enqueued
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Failure Alert Stacks Details */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
            <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1 w-full">
              <p className="text-sm font-bold text-destructive">
                DLQ Quarantined Failure Cause
              </p>
              <p className="text-xs font-semibold text-foreground break-all">
                {e.failureReason}
              </p>
              {e.errorStack && (
                <pre className="overflow-x-auto rounded border border-destructive/10 bg-background/50 p-4 font-mono text-xs text-foreground mt-3 break-all whitespace-pre-wrap">
                  {e.errorStack}
                </pre>
              )}
            </div>
          </div>

          {/* Original Payload codes */}
          <SectionCard title="Quarantined Payload JSON">
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 font-mono text-xs text-foreground">
              {JSON.stringify(job?.payload ?? {}, null, 2)}
            </pre>
          </SectionCard>

          {/* Metadata parameters */}
          <SectionCard title="Quarantined Parameters Metadata">
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 font-mono text-xs text-foreground">
              {JSON.stringify(job?.metadata ?? {}, null, 2)}
            </pre>
          </SectionCard>
        </div>

        {/* Sidebar specs */}
        <div className="space-y-6">
          <SectionCard title="DLQ Quarantined Specs">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Entry ID
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold break-all text-foreground">
                  {e.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Original Job ID
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold break-all">
                  <Link
                    href={`/dashboard/jobs/${e.jobId}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {e.jobId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Target Queue
                </dt>
                <dd className="mt-1 font-semibold text-foreground">
                  <Link
                    href={`/dashboard/queues/${job?.queueId}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <Database className="h-3.5 w-3.5" />
                    {job?.queueId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Quarantined Time
                </dt>
                <dd className="mt-1 text-xs text-foreground font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(e.quarantinedAt)}
                </dd>
              </div>
              {job?.workerId && (
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Quarantined Worker
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
              <hr className="border-border/60" />
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Total Retry Attempts
                </dt>
                <dd className="mt-1 font-mono text-xs text-foreground font-semibold">
                  {job?.attempts ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Status
                </dt>
                <dd className="mt-1 text-xs text-foreground font-semibold">
                  {e.status}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isReplayOpen}
        onClose={() => setIsReplayOpen(false)}
        onConfirm={triggerReplay}
        title="Confirm failure replay"
        message="Are you sure you want to clone this job payload parameters and queue it for immediate runtime execution?"
        confirmLabel="Replay immediately"
      />

      <ConfirmationModal
        isOpen={isPurgeOpen}
        onClose={() => setIsPurgeOpen(false)}
        onConfirm={triggerPurge}
        title="Confirm permanent DLQ purge"
        message="Warning: This action will permanently delete this dead letter quarantined entry. This action cannot be undone."
        confirmLabel="Purge permanently"
      />
    </DashboardContainer>
  );
}
