'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Archive, RotateCcw } from 'lucide-react';
import {
  useArchiveProject,
  useProject,
  useRestoreProject,
  useUpdateProject,
  useUpdateProjectSettings,
} from '../../../../../hooks/use-projects';
import { useAuth } from '../../../../../providers/auth-provider';
import { projectPermissions } from '../../../../../lib/project-rbac';
import { useToast } from '../../../../../components/feedback/toasts';
import {
  JsonEditor,
  parseJsonObject,
} from '../../../../../components/projects/project-fields';
import { DashboardContainer } from '../../../../../components/layout/dashboard-container';
import { PageHeader } from '../../../../../components/layout/page-header';
import {
  ErrorState,
  LoadingState,
} from '../../../../../components/feedback/states';
import { SectionCard } from '../../../../../components/ui/section-card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { ConfirmationModal } from '../../../../../components/ui/confirmation-modal';

const jsonObject = z.string().superRefine((value, context) => {
  try {
    parseJsonObject(value);
  } catch (error) {
    context.addIssue({ code: 'custom', message: (error as Error).message });
  }
});

const schema = z.object({
  name: z.string().trim().min(1, 'Project name is required.').max(100),
  description: z.string().max(500),
  metadata: jsonObject,
  settings: jsonObject,
});
type Values = z.infer<typeof schema>;

export default function ProjectSettingsPage() {
  const projectId = useParams<{ projectId: string }>().projectId;
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = projectPermissions(user?.role);
  const projectQuery = useProject(projectId);
  const updateProject = useUpdateProject();
  const updateSettings = useUpdateProjectSettings();
  const archiveProject = useArchiveProject();
  const restoreProject = useRestoreProject();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (projectQuery.data) {
      reset({
        name: projectQuery.data.name,
        description: projectQuery.data.description ?? '',
        metadata: JSON.stringify(projectQuery.data.metadata ?? {}, null, 2),
        settings: JSON.stringify(projectQuery.data.settings ?? {}, null, 2),
      });
    }
  }, [projectQuery.data, reset]);

  if (projectQuery.isLoading)
    return (
      <DashboardContainer>
        <LoadingState message="Loading project settings…" />
      </DashboardContainer>
    );
  if (
    projectQuery.error ||
    !projectQuery.data ||
    !permissions.canEditMetadata
  ) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Settings unavailable"
          message="The project could not be loaded or your role cannot edit it."
          onRetry={() => router.push(`/dashboard/projects/${projectId}`)}
        />
      </DashboardContainer>
    );
  }
  const project = projectQuery.data;

  const submit = handleSubmit(async (values) => {
    try {
      await updateProject.mutateAsync({
        projectId,
        updates: permissions.canConfigure
          ? {
              name: values.name,
              description: values.description,
              metadata: parseJsonObject(values.metadata),
            }
          : { metadata: parseJsonObject(values.metadata) },
      });
      if (permissions.canConfigure) {
        await updateSettings.mutateAsync({
          projectId,
          settings: parseJsonObject(values.settings),
        });
      }
      toast.success('Project updated', 'Your changes have been saved.');
      await projectQuery.refetch();
    } catch {
      toast.error('Update failed', 'The project settings could not be saved.');
    }
  });

  const changeArchiveState = async () => {
    if (project.isArchived) await restoreProject.mutateAsync(project);
    else await archiveProject.mutateAsync(project);
    toast.success(project.isArchived ? 'Project restored' : 'Project archived');
    await projectQuery.refetch();
  };

  return (
    <DashboardContainer>
      <PageHeader
        title={`${project.name} settings`}
        description={
          permissions.canConfigure
            ? 'Manage project configuration and metadata.'
            : 'Your Developer role can edit metadata only.'
        }
        actions={
          <Button variant="outline" size="sm">
            <Link
              className="flex items-center gap-2"
              href={`/dashboard/projects/${projectId}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Project details
            </Link>
          </Button>
        }
      />
      <form className="max-w-3xl space-y-6" onSubmit={submit}>
        <SectionCard title="General configuration">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Project name
              </label>
              <Input
                id="name"
                disabled={!permissions.canConfigure}
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Description
              </label>
              <textarea
                id="description"
                disabled={!permissions.canConfigure}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                {...register('description')}
              />
              {errors.description && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
            <Controller
              control={control}
              name="metadata"
              render={({ field }) => (
                <JsonEditor
                  id="metadata"
                  label="Metadata"
                  value={field.value ?? '{}'}
                  onChange={field.onChange}
                  error={errors.metadata?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="settings"
              render={({ field }) => (
                <JsonEditor
                  id="settings"
                  label="Runtime settings"
                  value={field.value ?? '{}'}
                  onChange={field.onChange}
                  error={errors.settings?.message}
                  disabled={!permissions.canConfigure}
                  description="Project-level scheduler settings as a JSON object."
                />
              )}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!isDirty}
                loading={updateProject.isPending || updateSettings.isPending}
              >
                Save changes
              </Button>
            </div>
          </div>
        </SectionCard>
      </form>

      {permissions.canArchive && (
        <div className="mt-6 max-w-3xl">
          <SectionCard
            title={project.isArchived ? 'Restore project' : 'Archive project'}
            description={
              project.isArchived
                ? 'Return this project to active use.'
                : 'Remove this project from active use while retaining its data.'
            }
          >
            <Button
              variant={project.isArchived ? 'default' : 'destructive'}
              onClick={() => setConfirmOpen(true)}
            >
              {project.isArchived ? (
                <RotateCcw className="mr-2 h-4 w-4" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              {project.isArchived ? 'Restore project' : 'Archive project'}
            </Button>
          </SectionCard>
        </div>
      )}
      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={changeArchiveState}
        title={project.isArchived ? 'Restore project' : 'Archive project'}
        message={
          project.isArchived
            ? `Restore ${project.name}?`
            : `Archive ${project.name}? Its configuration will be retained.`
        }
        confirmLabel={project.isArchived ? 'Restore' : 'Archive'}
        isDestructive={!project.isArchived}
      />
    </DashboardContainer>
  );
}
