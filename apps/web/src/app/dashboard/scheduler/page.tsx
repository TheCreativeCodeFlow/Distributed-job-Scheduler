'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RefreshCw,
  Play,
  ShieldCheck,
  Database,
  Cpu,
  Activity,
  Clock,
  Zap,
} from 'lucide-react';
import {
  useSchedulerStatus,
  useSchedulerMetrics,
  useSchedulerDashboard,
  useSchedulerHealth,
  usePromoteJobs,
} from '../../../hooks/use-scheduler';
import { useAuth } from '../../../providers/auth-provider';
import { queuePermissions } from '../../../lib/queue-state';
import { useToast } from '../../../components/feedback/toasts';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { SectionCard } from '../../../components/ui/section-card';
import { Button } from '../../../components/ui/button';
import { ConfirmationModal } from '../../../components/ui/confirmation-modal';
import { LoadingState } from '../../../components/feedback/states';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
};

export default function SchedulerOperationsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);

  const [isPromoteOpen, setIsPromoteOpen] = React.useState(false);

  const statusQuery = useSchedulerStatus();
  const metricsQuery = useSchedulerMetrics();
  const dashboardQuery = useSchedulerDashboard();
  const healthQuery = useSchedulerHealth();
  const promoteMutation = usePromoteJobs();

  const handlePromote = async () => {
    try {
      const res = await promoteMutation.mutateAsync(50);
      toast.success(
        'Promotion cycle triggered',
        `Successfully promoted ${res.promotedCount} scheduled jobs to QUEUED.`,
      );
      setIsPromoteOpen(false);
      statusQuery.refetch();
      metricsQuery.refetch();
      dashboardQuery.refetch();
      healthQuery.refetch();
    } catch {
      toast.error(
        'Promotion failed',
        'Could not manual trigger scheduled jobs promotion.',
      );
      setIsPromoteOpen(false);
    }
  };

  const isLoading =
    statusQuery.isLoading ||
    metricsQuery.isLoading ||
    dashboardQuery.isLoading ||
    healthQuery.isLoading;

  if (isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Connecting to scheduler engine telemetry..." />
      </DashboardContainer>
    );
  }

  const status = statusQuery.data ?? {
    status: 'ACTIVE',
    lastPromotionCycleAt: null,
  };
  const metrics = metricsQuery.data ?? {
    totalPromoted: 0,
    lastPromotedCount: 0,
    errorCount: 0,
    emptyScans: 0,
    lastPromotionLatencyMs: 0,
  };
  const dash = dashboardQuery.data ?? {
    status: 'ACTIVE',
    loopIntervalMs: 5000,
    totalPromotedJobs: 0,
  };
  const health = healthQuery.data ?? {
    databaseStatus: 'HEALTHY',
    redisStatus: 'HEALTHY',
    schedulerStatus: 'HEALTHY',
    workerAvailability: 'AVAILABLE',
    latencyMs: 10,
  };

  return (
    <DashboardContainer>
      <PageHeader
        title="Scheduler Operations Center"
        description="Monitor promotion cycle throughput, verify storage engine health connectivity, and run manual loops."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                statusQuery.refetch();
                metricsQuery.refetch();
                dashboardQuery.refetch();
                healthQuery.refetch();
              }}
              aria-label="Refresh scheduler parameters"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {permissions.canOperate && (
              <Button
                size="sm"
                onClick={() => setIsPromoteOpen(true)}
                disabled={promoteMutation.isPending}
              >
                <Zap className="h-4 w-4 text-amber-500" />
                Force Scheduled Promotion
              </Button>
            )}
          </div>
        }
      />

      {/* Health panels */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-bold uppercase">
              PostgreSQL Engine
            </p>
            <p
              className={`text-sm font-extrabold ${health.databaseStatus === 'HEALTHY' ? 'text-emerald-500' : 'text-rose-500'}`}
            >
              {health.databaseStatus}
            </p>
          </div>
          <Database className="h-7 w-7 text-muted-foreground/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-bold uppercase">
              Redis Cache Status
            </p>
            <p
              className={`text-sm font-extrabold ${health.redisStatus === 'HEALTHY' ? 'text-emerald-500' : 'text-rose-500'}`}
            >
              {health.redisStatus}
            </p>
          </div>
          <Activity className="h-7 w-7 text-muted-foreground/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-bold uppercase">
              Scheduler Loop
            </p>
            <p
              className={`text-sm font-extrabold ${health.schedulerStatus === 'HEALTHY' ? 'text-emerald-500' : 'text-rose-500'}`}
            >
              {health.schedulerStatus}
            </p>
          </div>
          <Clock className="h-7 w-7 text-muted-foreground/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-bold uppercase">
              Worker Pool Availability
            </p>
            <p
              className={`text-sm font-extrabold ${health.workerAvailability === 'AVAILABLE' ? 'text-emerald-500' : 'text-rose-500'}`}
            >
              {health.workerAvailability}
            </p>
          </div>
          <Cpu className="h-7 w-7 text-muted-foreground/30" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overview Stats */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Scheduler Status Overview">
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground font-semibold">
                  Engine State
                </dt>
                <dd className="mt-1 font-bold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {dash.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground font-semibold">
                  Loop Interval Delay
                </dt>
                <dd className="mt-1 font-mono text-sm text-foreground font-semibold">
                  {dash.loopIntervalMs}ms
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground font-semibold">
                  Last Promotion Time
                </dt>
                <dd className="mt-1 text-xs text-foreground font-semibold">
                  {formatDate(status.lastPromotionCycleAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground font-semibold">
                  Last Promotion Latency
                </dt>
                <dd className="mt-1 font-mono text-sm text-foreground font-semibold">
                  {metrics.lastPromotionLatencyMs}ms
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Chronological Metrics Telemetry">
            <dl className="grid gap-4 sm:grid-cols-3 text-sm">
              <div className="rounded-lg border bg-muted/20 p-3">
                <dt className="text-xs uppercase text-muted-foreground">
                  Total Promoted Jobs
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-foreground">
                  {metrics.totalPromoted}
                </dd>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <dt className="text-xs uppercase text-muted-foreground">
                  Empty Scans Count
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-foreground">
                  {metrics.emptyScans}
                </dd>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <dt className="text-xs uppercase text-muted-foreground">
                  Failed Loops Count
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-rose-500">
                  {metrics.errorCount}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>

        {/* Operational info */}
        <div>
          <SectionCard title="Policy Enforcement Specs">
            <div className="space-y-4 text-xs">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-foreground">
                    Loop Execution Policy
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Promotion loop processes scheduled tasks where executing
                    triggers have expired and promotes them into active queues
                    skip locked row locks.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 flex gap-3">
                <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-foreground font-sans">
                    Force Trigger Warning
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Forcing a scheduled promotion runs queries immediately
                    bypass loop intervals. Ensure backend capacities are not
                    saturated before execution.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isPromoteOpen}
        onClose={() => setIsPromoteOpen(false)}
        onConfirm={handlePromote}
        title="Confirm manual scheduler promotion"
        message="Are you sure you want to trigger scheduled jobs promotion immediately? This will bypass loop intervals."
        confirmLabel="Promote scheduled jobs"
      />
    </DashboardContainer>
  );
}
