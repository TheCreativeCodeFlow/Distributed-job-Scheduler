'use client';

import React from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import { apiClient } from '../../../../services/api-client';
import { useCreateProject } from '../../../../hooks/use-projects';
import { useAuth } from '../../../../providers/auth-provider';
import { projectPermissions } from '../../../../lib/project-rbac';
import { useToast } from '../../../../components/feedback/toasts';
import {
  parseJsonObject,
  JsonEditor,
} from '../../../../components/projects/project-fields';
import { DashboardContainer } from '../../../../components/layout/dashboard-container';
import { PageHeader } from '../../../../components/layout/page-header';
import { SectionCard } from '../../../../components/ui/section-card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { ErrorState } from '../../../../components/feedback/states';
import type { ProjectOrganization } from '../../../../types/project';

const schema = z.object({
  organizationId: z.string().uuid('Select an organization.'),
  name: z.string().trim().min(1, 'Project name is required.').max(100),
  slug: z
    .string()
    .min(3, 'Slug must contain at least 3 characters.')
    .max(64)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and single hyphens.',
    ),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or fewer.'),
  metadata: z.string().superRefine((value, context) => {
    try {
      parseJsonObject(value);
    } catch (error) {
      context.addIssue({ code: 'custom', message: (error as Error).message });
    }
  }),
});

type FormValues = z.infer<typeof schema>;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function CreateProjectPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = projectPermissions(user?.role);
  const createProject = useCreateProject();
  const manualSlug = React.useRef(false);
  const organizations = useQuery<ProjectOrganization[]>({
    queryKey: ['organizations'],
    queryFn: async () => (await apiClient.get('/organizations')).data,
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationId: '',
      name: '',
      slug: '',
      description: '',
      metadata: '{}',
    },
  });

  const name = watch('name');
  React.useEffect(() => {
    if (!manualSlug.current) {
      setValue('slug', slugify(name), { shouldValidate: Boolean(name) });
    }
  }, [name, setValue]);

  if (!permissions.canCreate) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Create permission required"
          message="Your role does not allow project creation."
          onRetry={() => router.push('/dashboard/projects')}
        />
      </DashboardContainer>
    );
  }

  const submit = handleSubmit(async (values) => {
    try {
      const project = await createProject.mutateAsync({
        ...values,
        description: values.description || undefined,
        metadata: parseJsonObject(values.metadata),
      });
      toast.success(
        'Project created',
        `${project.name} is ready to configure.`,
      );
      router.push(`/dashboard/projects/${project.id}`);
    } catch (error) {
      const message =
        (
          error as {
            response?: { data?: { detail?: string; message?: string } };
          }
        ).response?.data?.detail ??
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ??
        'The project could not be created.';
      toast.error('Creation failed', message);
    }
  });

  return (
    <DashboardContainer>
      <PageHeader
        title="Create project"
        description="Add a project to one of your organizations."
        actions={
          <Button variant="outline" size="sm">
            <Link
              className="flex items-center gap-2"
              href="/dashboard/projects"
            >
              <ArrowLeft className="h-4 w-4" /> Back to projects
            </Link>
          </Button>
        }
      />
      <form onSubmit={submit} noValidate className="max-w-3xl">
        <SectionCard
          title="Project information"
          description="Names are editable later; the generated slug identifies the project within its organization."
          actions={
            <FolderKanban className="h-5 w-5 text-primary" aria-hidden="true" />
          }
        >
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="organizationId"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Organization
              </label>
              <Controller
                control={control}
                name="organizationId"
                render={({ field }) => (
                  <Select
                    {...field}
                    id="organizationId"
                    aria-label="Organization"
                    disabled={organizations.isLoading}
                    error={errors.organizationId?.message}
                    placeholder="Select an organization"
                    options={(organizations.data ?? []).map((organization) => ({
                      value: organization.id,
                      label: `${organization.name} (${organization.slug})`,
                    }))}
                  />
                )}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Project name
                </label>
                <Input
                  id="name"
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="slug"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Slug
                </label>
                <Input
                  id="slug"
                  error={errors.slug?.message}
                  {...register('slug', {
                    onChange: () => {
                      manualSlug.current = true;
                    },
                  })}
                />
              </div>
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
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.metadata?.message}
                  description="A JSON object for labels and application-specific attributes."
                />
              )}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" loading={createProject.isPending}>
                Create project
              </Button>
            </div>
          </div>
        </SectionCard>
      </form>
    </DashboardContainer>
  );
}
