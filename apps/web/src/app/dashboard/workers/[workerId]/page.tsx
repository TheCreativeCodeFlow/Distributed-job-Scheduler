'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Cpu,
  Database,
  Tag,
  Clock,
  Settings,
  Trash2,
  Heart,
  HelpCircle,
  Play,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import {
  useWorker,
  useWorkerClaims,
  useWorkerLease,
  useDeregisterWorker,
  useRecoverWorker,
  useWorkerHeartbeat,
  useWorkerPoll,
} from '../../../../hooks/use-workers';
import { useNow } from '../../../../lib/live/useNow';
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
import { WorkerStatusBadge } from '../../../../components/workers/worker-status-badge';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function WorkerDetailsPage() {
  const workerId = useParams<{ workerId: string }>().workerId;
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);

  const [isDeregisterOpen, setIsDeregisterOpen] = React.useState(false);
  const [isRecoverOpen, setIsRecoverOpen] = React.useState(false);

  const workerQuery = useWorker(workerId);
  const claimsQuery = useWorkerClaims(workerId);
  const leaseQuery = useWorkerLease(workerId);

  const deregisterWorker = useDeregisterWorker();
  const recoverWorker = useRecoverWorker();
  const heartbeatMutation = useWorkerHeartbeat();
  const pollMutation = useWorkerPoll();

  const now = useNow();

  const heartbeatAge = React.useMemo(() => {
    if (!workerQuery.data?.lastHeartbeat) {
      return 'Never';
    }
    const diff = Math.round(
      (now.getTime() - new Date(workerQuery.data.lastHeartbeat).getTime()) /
        1000,
    );
    if (diff < 60) {
      return `${diff}s ago`;
    }
    const mins = Math.floor(diff / 60);
    return `${mins}m ago`;
  }, [workerQuery.data?.lastHeartbeat, now]);

  if (workerQuery.isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Loading compute node operations details..." />
      </DashboardContainer>
    );
  }

  if (workerQuery.error || !workerQuery.data) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Worker node unavailable"
          message="This compute node is currently offline or deregistered."
          onRetry={() => workerQuery.refetch()}
        />
      </DashboardContainer>
    );
  }

  const w = workerQuery.data;
  const claims = claimsQuery.data?.claims ?? [];
  const lease = leaseQuery.data;

  const activeClaimsCount = w.activeClaimsCount ?? 0;
  const maxConcurrency = w.maxConcurrency ?? 1;
  const usagePercent = Math.min(
    100,
    Math.round((activeClaimsCount / maxConcurrency) * 100),
  );

  const triggerHeartbeat = async () => {
    try {
      await heartbeatMutation.mutateAsync(w.id);
      toast.success(
        'Heartbeat registered',
        'Worker heartbeat update completed successfully.',
      );
      workerQuery.refetch();
    } catch {
      toast.error(
        'Heartbeat failed',
        'Could not complete heartbeat execution.',
      );
    }
  };

  const triggerPoll = async () => {
    try {
      const res = await pollMutation.mutateAsync(w.id);
      toast.success(
        'Poll triggered',
        `Worker polled successfully. Claimed ${res.claimedJobsCount} jobs.`,
      );
      workerQuery.refetch();
      claimsQuery.refetch();
    } catch {
      toast.error('Poll failed', 'Could not execute claims polling sequence.');
    }
  };

  const handleDeregister = async () => {
    try {
      await deregisterWorker.mutateAsync(w.id);
      toast.success(
        'Worker deregistered',
        `Worker node ${w.hostname} removed from the cluster.`,
      );
      setIsDeregisterOpen(false);
      router.push('/dashboard/workers');
    } catch {
      toast.error(
        'Deregistration failed',
        'Could not deregister compute node.',
      );
      setIsDeregisterOpen(false);
    }
  };

  const handleRecover = async () => {
    try {
      await recoverWorker.mutateAsync(w.id);
      toast.success(
        'Worker recovery initiated',
        `Worker node ${w.hostname} status reset to recovering.`,
      );
      setIsRecoverOpen(false);
      workerQuery.refetch();
    } catch {
      toast.error('Recovery failed', 'Could not recover lost compute node.');
      setIsRecoverOpen(false);
    }
  };

  const isLost = w.status === 'LOST';

  return (
    <DashboardContainer>
      <PageHeader
        title={w.hostname}
        description={`Manage active claims, leases, and concurrency limits.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <WorkerStatusBadge status={w.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                workerQuery.refetch();
                claimsQuery.refetch();
                leaseQuery.refetch();
              }}
              aria-label="Refresh telemetry data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {permissions.canOperate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerHeartbeat}
                  disabled={heartbeatMutation.isPending}
                >
                  <Heart className="h-4 w-4 text-rose-500" />
                  Ping Heartbeat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerPoll}
                  disabled={pollMutation.isPending}
                >
                  <Play className="h-4 w-4 text-emerald-500" />
                  Trigger Poll
                </Button>
                {isLost && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRecoverOpen(true)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Recover Node
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeregisterOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Deregister Node
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Capacity Visualization metrics card */}
          <SectionCard title="Capacity Utilization">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">
                  Concurrency Slots Assigned
                </span>
                <span className="font-semibold text-foreground">
                  {activeClaimsCount} / {maxConcurrency} slots used (
                  {usagePercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent > 85
                      ? 'bg-rose-500'
                      : usagePercent > 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold">
                    Active Claims
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-foreground">
                    {activeClaimsCount}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold">
                    Running Jobs
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-foreground">
                    {w.runningJobsCount ?? 0}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold">
                    Available Slots
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-foreground">
                    {Math.max(0, maxConcurrency - activeClaimsCount)}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Active claims subtable */}
          <SectionCard title="Active Claims & Leases">
            {claims.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No active job claims leased to this worker.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-xs font-bold uppercase text-muted-foreground">
                      <th className="py-2">Job ID</th>
                      <th className="py-2">Queue ID</th>
                      <th className="py-2">Claimed At</th>
                      <th className="py-2">Lease Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr
                        key={claim.jobId}
                        className="border-b border-border/40 hover:bg-muted/10 font-mono text-xs"
                      >
                        <td className="py-2.5">
                          <Link
                            href={`/dashboard/jobs/${claim.jobId}`}
                            className="text-primary hover:underline font-semibold"
                          >
                            {claim.jobId.slice(0, 8)}...
                          </Link>
                        </td>
                        <td className="py-2.5">
                          {claim.queueId.slice(0, 8)}...
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {formatDate(claim.claimedAt)}
                        </td>
                        <td className="py-2.5 text-rose-500 font-semibold">
                          {formatDate(claim.expiresAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Supported Queues & Tags layout maps */}
          <div className="grid gap-6 sm:grid-cols-2">
            <SectionCard title="Supported Queues">
              <div className="flex flex-wrap gap-2">
                {w.supportedQueues.map((q) => (
                  <span
                    key={q}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-medium text-foreground"
                  >
                    <Database className="h-3 w-3 text-muted-foreground" />
                    {q}
                  </span>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Supported Tags">
              <div className="flex flex-wrap gap-2">
                {w.supportedTags.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    No custom filter tags attached.
                  </span>
                ) : (
                  w.supportedTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-1 text-xs font-medium text-cyan-500"
                    >
                      <Tag className="h-3 w-3" />
                      {t}
                    </span>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Worker Metadata Configuration">
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 font-mono text-xs text-foreground">
              {JSON.stringify(w.metadata, null, 2)}
            </pre>
          </SectionCard>
        </div>

        {/* Sidebar Status Info Card */}
        <div className="space-y-6">
          <SectionCard title="Health & Heartbeats">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Last Heartbeat Ping
                </dt>
                <dd className="mt-1 text-foreground font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatDate(w.lastHeartbeat)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Heartbeat Age
                </dt>
                <dd className="mt-1 text-foreground font-bold text-base flex items-center gap-1">
                  <Cpu className="h-4 w-4 text-emerald-500" />
                  {heartbeatAge}
                </dd>
              </div>
              {lease && (
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Lease Expiring Time
                  </dt>
                  <dd className="mt-1 text-rose-500 font-semibold break-words">
                    {formatDate(lease.expiresAt)}
                  </dd>
                </div>
              )}
              <hr className="border-border/60" />
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Worker Node ID
                </dt>
                <dd className="mt-1 font-mono text-xs font-semibold text-foreground break-all">
                  {w.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Instance ID
                </dt>
                <dd className="mt-1 font-mono text-xs text-muted-foreground break-all">
                  {w.instanceId}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Daemon Version
                </dt>
                <dd className="mt-1 font-mono text-xs text-foreground">
                  {w.version}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Registered
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {formatDate(w.createdAt)}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeregisterOpen}
        onClose={() => setIsDeregisterOpen(false)}
        onConfirm={handleDeregister}
        title="Deregister Compute Worker"
        message={`Are you sure you want to deregister compute worker node ${w.hostname}? It will be removed from the cluster listing.`}
        confirmLabel="Deregister"
        isDestructive
      />

      <ConfirmationModal
        isOpen={isRecoverOpen}
        onClose={() => setIsRecoverOpen(false)}
        onConfirm={handleRecover}
        title="Recover Lost Worker"
        message={`Re-initialize node state transitions context configurations for worker ${w.hostname}?`}
        confirmLabel="Recover"
      />
    </DashboardContainer>
  );
}
