'use client';

import React from 'react';
import {
  Download,
  RefreshCw,
  Activity,
  Cpu,
  Database,
  EyeOff,
  LayoutGrid,
} from 'lucide-react';
import {
  useQueuesMetrics,
  useWorkersMetrics,
  useJobsMetrics,
  useRetriesMetrics,
  useDlqMetrics,
  useSchedulerMetrics,
  useSystemMetrics,
  useDashboardHealth,
} from '../../../hooks/use-metrics';
import { useLiveUpdates } from '../../../lib/live/useLiveUpdates';
import { globalRefreshManager } from '../../../lib/live/RefreshManager';
import { LiveContext } from '../../../lib/live/LiveContext';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { SectionCard } from '../../../components/ui/section-card';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';
import { LoadingState } from '../../../components/feedback/states';

const formatDuration = (ms?: number | null) => {
  if (ms === undefined || ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export default function MetricsCenterPage() {
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());

  const { refetchInterval, isVisible, pollingInterval, triggerRefresh } =
    useLiveUpdates({
      moduleKey: 'metrics',
    });

  const { setPollingInterval } = React.useContext(LiveContext) || {
    setPollingInterval: () => {},
  };

  const queuesQuery = useQueuesMetrics(refetchInterval);
  const workersQuery = useWorkersMetrics(refetchInterval);
  const jobsQuery = useJobsMetrics(refetchInterval);
  const retriesQuery = useRetriesMetrics(refetchInterval);
  const dlqQuery = useDlqMetrics(refetchInterval);
  const schedulerQuery = useSchedulerMetrics(refetchInterval);
  const systemQuery = useSystemMetrics(refetchInterval);
  const healthQuery = useDashboardHealth(refetchInterval);

  React.useEffect(() => {
    if (
      !queuesQuery.isFetching &&
      !workersQuery.isFetching &&
      !jobsQuery.isFetching
    ) {
      setLastUpdated(new Date());
    }
  }, [queuesQuery.isFetching, workersQuery.isFetching, jobsQuery.isFetching]);

  // Subscribe to manual and broadcast refresh events
  React.useEffect(() => {
    const unsub = globalRefreshManager.subscribeToRefresh('metrics', () => {
      queuesQuery.refetch();
      workersQuery.refetch();
      jobsQuery.refetch();
      retriesQuery.refetch();
      dlqQuery.refetch();
      schedulerQuery.refetch();
      systemQuery.refetch();
      healthQuery.refetch();
    });
    return unsub;
  }, [
    queuesQuery,
    workersQuery,
    jobsQuery,
    retriesQuery,
    dlqQuery,
    schedulerQuery,
    systemQuery,
    healthQuery,
  ]);

  const handleManualRefresh = () => {
    triggerRefresh('metrics');
  };

  const handleExportJSON = () => {
    const data = {
      queues: queuesQuery.data,
      workers: workersQuery.data,
      jobs: jobsQuery.data,
      retries: retriesQuery.data,
      dlq: dlqQuery.data,
      scheduler: schedulerQuery.data,
      system: systemQuery.data,
      health: healthQuery.data,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scheduler-metrics-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Metric Section', 'Metric Name', 'Metric Value'],
      [
        'Health',
        'Database Status',
        healthQuery.data?.databaseStatus ?? 'HEALTHY',
      ],
      ['Health', 'Redis Status', healthQuery.data?.redisStatus ?? 'HEALTHY'],
      ['Jobs', 'Queued', jobsQuery.data?.queued ?? 0],
      ['Jobs', 'Claimed', jobsQuery.data?.claimed ?? 0],
      ['Jobs', 'Running', jobsQuery.data?.running ?? 0],
      ['Jobs', 'Completed', jobsQuery.data?.completed ?? 0],
      ['Jobs', 'Failed', jobsQuery.data?.failed ?? 0],
      ['Queues', 'Active', queuesQuery.data?.active ?? 0],
      ['Workers', 'Registered', workersQuery.data?.registered ?? 0],
      ['DLQ', 'Active', dlqQuery.data?.active ?? 0],
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `scheduler-metrics-${new Date().toISOString()}.csv`;
    link.click();
  };

  const isLoading =
    queuesQuery.isLoading ||
    workersQuery.isLoading ||
    jobsQuery.isLoading ||
    retriesQuery.isLoading ||
    dlqQuery.isLoading ||
    schedulerQuery.isLoading ||
    systemQuery.isLoading ||
    healthQuery.isLoading;

  if (isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Connecting to Prometheus telemetry metrics..." />
      </DashboardContainer>
    );
  }

  const q = queuesQuery.data ?? {
    active: 0,
    paused: 0,
    disabled: 0,
    draining: 0,
  };
  const w = workersQuery.data ?? {
    registered: 0,
    idle: 0,
    running: 0,
    lost: 0,
    recovering: 0,
  };
  const j = jobsQuery.data ?? {
    queued: 0,
    claimed: 0,
    running: 0,
    completed: 0,
    failed: 0,
    scheduled: 0,
  };
  const r = retriesQuery.data ?? { pending: 0, exhausted: 0 };
  const d = dlqQuery.data ?? { active: 0, replayed: 0 };
  const s = schedulerQuery.data ?? {
    promotionCount: 0,
    emptyScans: 0,
    batchSizes: 0,
    promotionLatency: 0,
  };
  const sys = systemQuery.data ?? {
    databaseLatency: 0,
    redisLatency: 0,
    uptime: 0,
    heartbeatRenewalRate: 0,
    expiredLeases: 0,
  };
  const h = healthQuery.data ?? {
    databaseStatus: 'HEALTHY',
    redisStatus: 'HEALTHY',
    schedulerStatus: 'HEALTHY',
    workerAvailability: 'AVAILABLE',
  };

  const totalJobs =
    (j.queued ?? 0) +
    (j.claimed ?? 0) +
    (j.running ?? 0) +
    (j.completed ?? 0) +
    (j.failed ?? 0) +
    (j.scheduled ?? 0);

  return (
    <DashboardContainer>
      <PageHeader
        title="Metrics & Observability"
        description="Real-time telemetry, capacity utilization, queue depth, and storage engines latency charts."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isVisible && (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                <EyeOff className="h-3.5 w-3.5" />
                Auto-refresh paused (Tab hidden)
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <div className="w-36">
              <Select
                aria-label="Refresh Interval"
                value={
                  pollingInterval === 'off' || pollingInterval === 'manual'
                    ? String(pollingInterval)
                    : String(pollingInterval)
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setPollingInterval(
                    val === 'off' || val === 'manual'
                      ? val
                      : (Number(val) as any),
                  );
                }}
                options={[
                  { value: 'manual', label: 'Manual only' },
                  { value: '5000', label: 'Every 5s' },
                  { value: '10000', label: 'Every 10s' },
                  { value: '30000', label: 'Every 30s' },
                ]}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              aria-label="Refresh telemetry"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Observability KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase">
              Total Workload Jobs
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-1">
              {totalJobs}
            </p>
          </div>
          <LayoutGrid className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase">
              Active Queues
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-1">
              {q.active}
            </p>
          </div>
          <Database className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase">
              Registered Workers
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-1">
              {w.registered}
            </p>
          </div>
          <Cpu className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase">
              API / DB Latency
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-1">
              {sys.databaseLatency}ms
            </p>
          </div>
          <Activity className="h-8 w-8 text-muted-foreground/30" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Jobs distribution bar */}
        <SectionCard title="Jobs Status Distribution">
          <div className="space-y-4 py-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-foreground">COMPLETED</span>
                <span>{j.completed}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${totalJobs > 0 ? (j.completed / totalJobs) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-foreground font-sans">
                  FAILED / DEAD LETTER
                </span>
                <span className="text-rose-500">{j.failed}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500"
                  style={{
                    width: `${totalJobs > 0 ? (j.failed / totalJobs) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-foreground">RUNNING</span>
                <span className="text-sky-500">{j.running}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500"
                  style={{
                    width: `${totalJobs > 0 ? (j.running / totalJobs) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Worker capacity chart */}
        <SectionCard title="Workers Status Distribution">
          <div className="space-y-4 py-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-foreground">Running workload</span>
                <span>{w.running}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${w.registered > 0 ? (w.running / w.registered) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-foreground">Idle capacity</span>
                <span>{w.idle}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500"
                  style={{
                    width: `${w.registered > 0 ? (w.idle / w.registered) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-rose-500">Lost Workers</span>
                <span className="text-rose-500">{w.lost}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500"
                  style={{
                    width: `${w.registered > 0 ? (w.lost / w.registered) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Latency statistics */}
        <SectionCard title="Storage Engines Latency">
          <div className="space-y-4 py-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>PostgreSQL Latency</span>
                <span>{sys.databaseLatency}ms</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.min(100, (sys.databaseLatency / 200) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Redis cache latency</span>
                <span>{sys.redisLatency}ms</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${Math.min(100, (sys.redisLatency / 50) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Scheduler Promotion loop latency</span>
                <span>{s.promotionLatency}ms</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500"
                  style={{
                    width: `${Math.min(100, (s.promotionLatency / 500) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Retry trends stats */}
        <SectionCard title="Retry & Backoff metrics">
          <dl className="grid grid-cols-2 gap-4 text-sm py-2">
            <div className="rounded border p-3 bg-muted/10">
              <dt className="text-xs text-muted-foreground font-semibold">
                RETRY PENDING
              </dt>
              <dd className="mt-1 text-xl font-extrabold text-amber-500">
                {r.pending}
              </dd>
            </div>
            <div className="rounded border p-3 bg-muted/10">
              <dt className="text-xs text-muted-foreground font-semibold">
                RETRY EXHAUSTED
              </dt>
              <dd className="mt-1 text-xl font-extrabold text-rose-500">
                {r.exhausted}
              </dd>
            </div>
          </dl>
        </SectionCard>

        {/* DLQ quarantine parameters stats */}
        <SectionCard title="Dead Letter Queue growth">
          <dl className="grid grid-cols-2 gap-4 text-sm py-2">
            <div className="rounded border p-3 bg-muted/10">
              <dt className="text-xs text-muted-foreground font-semibold">
                ACTIVE DLQ ENTRIES
              </dt>
              <dd className="mt-1 text-xl font-extrabold text-rose-500">
                {d.active}
              </dd>
            </div>
            <div className="rounded border p-3 bg-muted/10">
              <dt className="text-xs text-muted-foreground font-semibold">
                REPLAYED ENTRIES
              </dt>
              <dd className="mt-1 text-xl font-extrabold text-emerald-500">
                {d.replayed}
              </dd>
            </div>
          </dl>
        </SectionCard>

        {/* System Uptime info */}
        <SectionCard title="System Telemetry Specs">
          <dl className="grid grid-cols-2 gap-4 text-sm py-2">
            <div className="rounded border p-3 bg-muted/10">
              <dt className="text-xs text-muted-foreground font-semibold">
                HEARTBEAT RENEWALS
              </dt>
              <dd className="mt-1 text-xl font-extrabold text-foreground">
                {sys.heartbeatRenewalRate}
              </dd>
            </div>
            <div className="rounded border p-3 bg-muted/10">
              <dt className="text-xs text-muted-foreground font-semibold">
                EXPIRED LEASES
              </dt>
              <dd className="mt-1 text-xl font-extrabold text-rose-500">
                {sys.expiredLeases}
              </dd>
            </div>
          </dl>
        </SectionCard>
      </div>
    </DashboardContainer>
  );
}
