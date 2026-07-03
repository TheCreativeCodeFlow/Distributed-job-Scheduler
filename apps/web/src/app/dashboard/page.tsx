'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api-client';
import { usePreferencesStore } from '../../store/preferences';
import { useFiltersStore } from '../../store/filters';
import { PageHeader } from '../../components/layout/page-header';
import { DashboardContainer } from '../../components/layout/dashboard-container';
import { StatisticGrid } from '../../components/layout/statistic-grid';
import { MetricCard } from '../../components/charts/metric-card';
import { SystemHealth } from './system-health';
import { ActivityFeed } from './activity-feed';
import { QuickActions } from './quick-actions';
import { LoadingState, ErrorState } from '../../components/feedback/states';
import { DonutChart } from '../../components/charts/donut-chart';
import { BarChart } from '../../components/charts/bar-chart';
import {
  Building2,
  FolderGit,
  Layers,
  Cpu,
  Play,
  CalendarDays,
  RefreshCw,
  Skull,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function DashboardPage() {
  const { preferences } = usePreferencesStore();
  const { filters } = useFiltersStore();
  const refetchInterval = preferences.refreshIntervalMs || 5000;

  // Query: Overview
  const {
    data: overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['dashboard', 'overview', filters.orgId, filters.projectId],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/overview');
      return response.data;
    },
    refetchInterval,
  });

  // Query: Health
  const {
    data: health,
    isLoading: isHealthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['dashboard', 'health'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/health');
      return response.data;
    },
    refetchInterval,
  });

  // Query: Activity Feed
  const {
    data: activity,
    isLoading: isActivityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ['dashboard', 'activity', filters.orgId, filters.projectId],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/activity');
      return response.data;
    },
    refetchInterval,
  });

  // Query: Queues Metrics
  const {
    data: queuesMetrics,
    isLoading: isQueuesMetricsLoading,
    error: queuesMetricsError,
    refetch: refetchQueuesMetrics,
  } = useQuery({
    queryKey: ['metrics', 'queues', filters.orgId],
    queryFn: async () => {
      const response = await apiClient.get('/metrics/queues');
      return response.data;
    },
    refetchInterval,
  });

  // Query: Workers Metrics
  const {
    data: workersMetrics,
    isLoading: isWorkersMetricsLoading,
    error: workersMetricsError,
    refetch: refetchWorkersMetrics,
  } = useQuery({
    queryKey: ['metrics', 'workers'],
    queryFn: async () => {
      const response = await apiClient.get('/metrics/workers');
      return response.data;
    },
    refetchInterval,
  });

  const handleManualRefresh = () => {
    refetchOverview();
    refetchHealth();
    refetchActivity();
    refetchQueuesMetrics();
    refetchWorkersMetrics();
  };

  const hasError =
    overviewError ||
    healthError ||
    activityError ||
    queuesMetricsError ||
    workersMetricsError;
  const isLoading =
    isOverviewLoading ||
    isHealthLoading ||
    isActivityLoading ||
    isQueuesMetricsLoading ||
    isWorkersMetricsLoading;

  if (hasError) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Failed to Load Dashboard"
          message="An error occurred while connecting to the cluster telemetry API."
          onRetry={handleManualRefresh}
        />
      </DashboardContainer>
    );
  }

  if (isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Connecting to telemetry cluster..." />
      </DashboardContainer>
    );
  }

  // Preformat data for donut charts
  const queueData = queuesMetrics
    ? [
        { label: 'Active', value: queuesMetrics.active || 0, color: '#10b981' },
        { label: 'Paused', value: queuesMetrics.paused || 0, color: '#f59e0b' },
        {
          label: 'Disabled',
          value: queuesMetrics.disabled || 0,
          color: '#ef4444',
        },
        {
          label: 'Draining',
          value: queuesMetrics.draining || 0,
          color: '#3b82f6',
        },
      ]
    : [];

  const workerData = workersMetrics
    ? [
        {
          label: 'Running',
          value: workersMetrics.running || 0,
          color: '#10b981',
        },
        { label: 'Idle', value: workersMetrics.idle || 0, color: '#64748b' },
        { label: 'Lost', value: workersMetrics.lost || 0, color: '#ef4444' },
        {
          label: 'Recovering',
          value: workersMetrics.recovering || 0,
          color: '#f59e0b',
        },
      ]
    : [];

  const jobThroughputData = overview?.throughput
    ? [
        {
          label: 'Completed',
          value: overview.throughput.completed24h || 0,
          color: '#10b981',
        },
        {
          label: 'Failed',
          value: overview.throughput.failed24h || 0,
          color: '#ef4444',
        },
      ]
    : [];

  return (
    <DashboardContainer>
      <PageHeader
        title="Operations Overview"
        description="Monitor system cluster performance, job throughput, and worker node health."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            className="gap-2 text-xs"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <StatisticGrid>
        <MetricCard
          title="Organizations"
          value={overview?.organizationsCount ?? 0}
          icon={Building2}
          description="Managed tenants"
        />
        <MetricCard
          title="Projects"
          value={overview?.projectsCount ?? 0}
          icon={FolderGit}
          description="Workspace subdivisions"
        />
        <MetricCard
          title="Active Queues"
          value={overview?.queuesCount ?? 0}
          icon={Layers}
          description="Ingesting jobs"
        />
        <MetricCard
          title="Running Jobs"
          value={overview?.runningJobsCount ?? 0}
          icon={Play}
          description="Executing in cluster"
        />
        <MetricCard
          title="Scheduled Jobs"
          value={overview?.scheduledJobsCount ?? 0}
          icon={CalendarDays}
          description="Pending cron/timers"
        />
        <MetricCard
          title="Active Workers"
          value={overview?.activeWorkersCount ?? 0}
          icon={Cpu}
          description="Registered cluster nodes"
        />
        <MetricCard
          title="Retry Pending"
          value={overview?.retryPendingJobsCount ?? 0}
          icon={RefreshCw}
          description="Waiting for recovery"
        />
        <MetricCard
          title="DLQ Entries"
          value={overview?.dlqEntriesCount ?? 0}
          icon={Skull}
          description="Quarantined failures"
        />
      </StatisticGrid>

      {/* Health, Quick Actions, and Activity Feed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SystemHealth health={health} />
          <ActivityFeed activity={activity} />
        </div>
        <div className="space-y-6">
          <QuickActions />

          {/* Jobs Throughput Donut */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-bold text-foreground mb-4">
              Job Throughput (24h)
            </h4>
            <div className="h-44 flex items-center justify-center">
              {jobThroughputData.some((d) => d.value > 0) ? (
                <DonutChart data={jobThroughputData} />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">
                  No recent throughput metrics
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Queues Metrics */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="text-sm font-bold text-foreground mb-4">
            Queue Activity Breakdown
          </h4>
          <div className="h-56 flex items-center justify-center">
            {queueData.some((d) => d.value > 0) ? (
              <DonutChart data={queueData} />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                No queue stats recorded
              </span>
            )}
          </div>
        </div>

        {/* Workers Status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="text-sm font-bold text-foreground mb-4">
            Worker Status Breakdown
          </h4>
          <div className="h-56 flex items-center justify-center">
            {workerData.some((d) => d.value > 0) ? (
              <DonutChart data={workerData} />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                No worker nodes detected
              </span>
            )}
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
}
