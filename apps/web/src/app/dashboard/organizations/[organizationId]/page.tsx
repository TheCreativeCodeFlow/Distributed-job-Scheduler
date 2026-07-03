'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../../services/api-client';
import { PageHeader } from '../../../../components/layout/page-header';
import { DashboardContainer } from '../../../../components/layout/dashboard-container';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../../../components/ui/card';
import { StatisticGrid } from '../../../../components/layout/statistic-grid';
import { MetricCard } from '../../../../components/charts/metric-card';
import {
  LoadingState,
  ErrorState,
} from '../../../../components/feedback/states';
import {
  Building2,
  Settings,
  History,
  FolderKanban,
  Users,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';

export default function OrganizationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;

  // Query: Organization Details
  const {
    data: org,
    isLoading: isOrgLoading,
    error: orgError,
  } = useQuery({
    queryKey: ['organizations', organizationId],
    queryFn: async () => {
      const response = await apiClient.get(`/organizations/${organizationId}`);
      return response.data;
    },
    enabled: !!organizationId,
  });

  // Query: Statistics
  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['organizations', organizationId, 'statistics'],
    queryFn: async () => {
      const response = await apiClient.get(
        `/organizations/${organizationId}/statistics`,
      );
      return response.data;
    },
    enabled: !!organizationId,
  });

  // Query: Projects List
  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ['organizations', organizationId, 'projects'],
    queryFn: async () => {
      const response = await apiClient.get(
        `/organizations/${organizationId}/projects`,
      );
      return response.data;
    },
    enabled: !!organizationId,
  });

  // Query: Activity log
  const {
    data: activities = [],
    isLoading: isActivityLoading,
    error: activityError,
  } = useQuery({
    queryKey: ['organizations', organizationId, 'activity'],
    queryFn: async () => {
      const response = await apiClient.get(
        `/organizations/${organizationId}/activity`,
      );
      return response.data;
    },
    enabled: !!organizationId,
  });

  const isLoading =
    isOrgLoading || isStatsLoading || isProjectsLoading || isActivityLoading;
  const hasError = orgError || statsError || projectsError || activityError;

  if (hasError) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Organization Missing"
          message="An error occurred while loading this organization. Please verify your access privileges."
          onRetry={() => router.back()}
        />
      </DashboardContainer>
    );
  }

  if (isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Loading organization telemetry context..." />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <PageHeader
        title={org?.name || 'Organization'}
        description={`Manage active configurations for organizational slug '${org?.slug}'.`}
        actions={
          <Link href={`/dashboard/organizations/${organizationId}/settings`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        }
      />

      {/* Stats KPI grid */}
      <StatisticGrid>
        <MetricCard
          title="Team Members"
          value={stats?.memberCount ?? 0}
          icon={Users}
          description="Assigned role members"
        />
        <MetricCard
          title="Pending Invites"
          value={stats?.activeInvitations ?? 0}
          icon={ShieldAlert}
          description="Waiting for approval"
        />
        <MetricCard
          title="Projects"
          value={projects.length}
          icon={FolderKanban}
          description="Organizational projects"
        />
        <MetricCard
          title="System Status"
          value={org?.isSuspended ? 'SUSPENDED' : 'OPERATIONAL'}
          icon={Building2}
          description={
            org?.isSuspended ? 'Suspended by admin' : 'Active and working'
          }
        />
      </StatisticGrid>

      {/* Projects list & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Projects panel */}
          <Card className="bg-card/60 backdrop-blur-md">
            <CardHeader className="border-b border-border/40 pb-4 mb-4 bg-muted/5">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                Active Projects Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 select-none">
              {projects.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-muted-foreground">
                  No projects initialized under this organization.
                </div>
              ) : (
                projects.map((proj: any) => (
                  <div
                    key={proj.id}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-secondary/20 border border-border/40 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-foreground">
                        {proj.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        slug: {proj.slug}
                      </span>
                    </div>
                    <Link href={`/dashboard/projects/${proj.id}`}>
                      <Button variant="ghost" size="sm">
                        View Core
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity logs feed */}
        <div className="space-y-6">
          <Card className="bg-card/60 backdrop-blur-md">
            <CardHeader className="border-b border-border/40 pb-4 mb-4 bg-muted/5">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <History className="h-5 w-5 text-violet-400" />
                Recent Operations Log
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto space-y-4 pr-1 select-none">
              {activities.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-muted-foreground">
                  No activities recorded.
                </div>
              ) : (
                activities.map((act: any) => (
                  <div
                    key={act.id}
                    className="flex gap-3 text-xs leading-relaxed"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">
                        {act.action}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardContainer>
  );
}
