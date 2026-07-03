'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Activity,
  Archive,
  Building2,
  Calendar,
  FolderKanban,
  ListTodo,
  Settings,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../services/api-client';
import { useProject, useProjectQueues } from '../../../../hooks/use-projects';
import { useAuth } from '../../../../providers/auth-provider';
import { projectPermissions } from '../../../../lib/project-rbac';
import { DashboardContainer } from '../../../../components/layout/dashboard-container';
import { PageHeader } from '../../../../components/layout/page-header';
import {
  ErrorState,
  LoadingState,
} from '../../../../components/feedback/states';
import { ProjectStatus } from '../../../../components/projects/project-status';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { MetricCard } from '../../../../components/charts/metric-card';
import { StatisticGrid } from '../../../../components/layout/statistic-grid';
import { SectionCard } from '../../../../components/ui/section-card';
import type { ProjectOrganization } from '../../../../types/project';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function ProjectDetailsPage() {
  const projectId = useParams<{ projectId: string }>().projectId;
  const { user } = useAuth();
  const permissions = projectPermissions(user?.role);
  const projectQuery = useProject(projectId);
  const queuesQuery = useProjectQueues(projectId);
  const organizationQuery = useQuery<ProjectOrganization>({
    queryKey: ['organizations', projectQuery.data?.organizationId],
    queryFn: async () =>
      (
        await apiClient.get(
          `/organizations/${projectQuery.data!.organizationId}`,
        )
      ).data,
    enabled: Boolean(projectQuery.data?.organizationId),
  });

  if (projectQuery.isLoading || queuesQuery.isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Loading project workspace…" />
      </DashboardContainer>
    );
  }
  if (projectQuery.error || queuesQuery.error || !projectQuery.data) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Project unavailable"
          message="The project could not be loaded or you no longer have access."
          onRetry={() => {
            projectQuery.refetch();
            queuesQuery.refetch();
          }}
        />
      </DashboardContainer>
    );
  }

  const project = projectQuery.data;
  const queues = queuesQuery.data ?? [];
  const activeQueues = queues.filter(
    (queue) => queue.isActive && !queue.isArchived,
  );
  const pausedQueues = queues.filter(
    (queue) => queue.status.toUpperCase() === 'PAUSED',
  );
  const metadata = Object.entries(project.metadata ?? {});
  const activities = [
    { label: 'Project updated', timestamp: project.updatedAt },
    { label: 'Project created', timestamp: project.createdAt },
  ].filter(
    (item, index, all) =>
      index === 0 || item.timestamp !== all[index - 1]?.timestamp,
  );

  return (
    <DashboardContainer>
      <PageHeader
        title={project.name}
        description={project.description || `Project slug: ${project.slug}`}
        actions={
          <div className="flex items-center gap-2">
            <ProjectStatus project={project} />
            {permissions.canEditMetadata && (
              <Button variant="outline" size="sm">
                <Link
                  className="flex items-center gap-2"
                  href={`/dashboard/projects/${project.id}/settings`}
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <StatisticGrid>
        <MetricCard
          title="Queues"
          value={queues.length}
          icon={ListTodo}
          description="Configured queues"
        />
        <MetricCard
          title="Active queues"
          value={activeQueues.length}
          icon={Activity}
          description="Ready to process jobs"
        />
        <MetricCard
          title="Paused queues"
          value={pausedQueues.length}
          icon={Archive}
          description="Temporarily paused"
        />
        <MetricCard
          title="Metadata fields"
          value={metadata.length}
          icon={FolderKanban}
          description="Custom attributes"
        />
      </StatisticGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Project information">
            <dl className="grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Organization
                </dt>
                <dd className="mt-1 flex items-center gap-2 font-semibold">
                  <Building2 className="h-4 w-4" />
                  {organizationQuery.data?.name ?? 'Loading…'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Slug
                </dt>
                <dd className="mt-1 font-mono">{project.slug}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Created
                </dt>
                <dd className="mt-1">{formatDate(project.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  Last updated
                </dt>
                <dd className="mt-1">{formatDate(project.updatedAt)}</dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard
            title="Queue summary"
            description="Live queue configuration returned by the scheduler API."
          >
            {queues.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No queues have been created for this project.
              </p>
            ) : (
              <div className="space-y-2">
                {queues.slice(0, 8).map((queue) => (
                  <div
                    key={queue.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{queue.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {queue.slug}
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {queue.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Metadata">
            {metadata.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No metadata configured.
              </p>
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2">
                {metadata.map(([key, value]) => (
                  <div key={key} className="rounded-md bg-muted/30 p-3">
                    <dt className="text-xs font-bold text-muted-foreground">
                      {key}
                    </dt>
                    <dd className="mt-1 break-all font-mono text-xs">
                      {JSON.stringify(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </SectionCard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((item) => (
              <div
                key={item.label}
                className="border-l-2 border-primary/40 pl-3"
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(item.timestamp)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardContainer>
  );
}
