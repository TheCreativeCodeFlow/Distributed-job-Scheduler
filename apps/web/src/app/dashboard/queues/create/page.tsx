'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '../../../../services/api-client';
import { useCreateQueue } from '../../../../hooks/use-queues';
import { useAuth } from '../../../../providers/auth-provider';
import { queuePermissions } from '../../../../lib/queue-state';
import { useToast } from '../../../../components/feedback/toasts';
import {
  JsonEditor,
  parseJsonObject,
} from '../../../../components/projects/project-fields';
import { DashboardContainer } from '../../../../components/layout/dashboard-container';
import { PageHeader } from '../../../../components/layout/page-header';
import { SectionCard } from '../../../../components/ui/section-card';
import { ErrorState } from '../../../../components/feedback/states';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import type { Project, ProjectOrganization } from '../../../../types/project';

const schema = z.object({
  projectId: z.string().uuid('Select a project.'),
  name: z.string().trim().min(1, 'Queue name is required.').max(100),
  slug: z
    .string()
    .min(3)
    .max(64)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and single hyphens.',
    ),
  description: z.string().max(500),
  priority: z.coerce.number().int().nonnegative(),
  maxConcurrency: z.coerce
    .number()
    .int()
    .positive('Concurrency must be positive.'),
  rateLimit: z.union([
    z.literal(''),
    z.coerce.number().int().positive('Rate limit must be positive.'),
  ]),
  retryPolicyId: z.string().uuid('Enter a valid retry policy UUID.'),
  metadata: z.string().superRefine((value, context) => {
    try {
      parseJsonObject(value);
    } catch (error) {
      context.addIssue({ code: 'custom', message: (error as Error).message });
    }
  }),
});
type Values = z.infer<typeof schema>;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function CreateQueuePage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);
  const createQueue = useCreateQueue();
  const manualSlug = React.useRef(false);
  const projects = useQuery<Project[]>({
    queryKey: ['projects', 'queue-selector'],
    queryFn: async () => {
      const organizations = (await apiClient.get('/organizations'))
        .data as ProjectOrganization[];
      const groups = await Promise.all(
        organizations.map(async (organization) =>
          (
            (await apiClient.get(`/organizations/${organization.id}/projects`))
              .data as Project[]
          )
            .filter((project) => project.isActive && !project.isArchived)
            .map((project) => ({ ...project, organization })),
        ),
      );
      return groups.flat();
    },
  });
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: '',
      name: '',
      slug: '',
      description: '',
      priority: 0,
      maxConcurrency: 10,
      rateLimit: '',
      retryPolicyId: '00000000-0000-0000-0000-000000000001',
      metadata: '{}',
    },
  });
  const name = watch('name');
  React.useEffect(() => {
    if (!manualSlug.current)
      setValue('slug', slugify(name), { shouldValidate: Boolean(name) });
  }, [name, setValue]);

  if (!permissions.canCreate) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Create permission required"
          message="Your role does not allow queue creation."
          onRetry={() => router.push('/dashboard/queues')}
        />
      </DashboardContainer>
    );
  }

  const submit = handleSubmit(async (values) => {
    try {
      const queue = await createQueue.mutateAsync({
        ...values,
        description: values.description || undefined,
        rateLimit: values.rateLimit === '' ? undefined : values.rateLimit,
        metadata: parseJsonObject(values.metadata),
      });
      toast.success('Queue created', `${queue.name} is ready.`);
      router.push(`/dashboard/queues/${queue.id}`);
    } catch {
      toast.error('Creation failed', 'The queue could not be created.');
    }
  });

  return (
    <DashboardContainer>
      <PageHeader
        title="Create queue"
        description="Configure a scheduler queue within an active project."
        actions={
          <Button variant="outline" size="sm">
            <Link href="/dashboard/queues" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to queues
            </Link>
          </Button>
        }
      />
      <form onSubmit={submit} noValidate className="max-w-3xl">
        <SectionCard
          title="Queue configuration"
          description="Retry policy IDs are supplied directly because the backend currently has no retry-policy discovery endpoint."
        >
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="projectId"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Project
              </label>
              <Controller
                control={control}
                name="projectId"
                render={({ field }) => (
                  <Select
                    {...field}
                    id="projectId"
                    aria-label="Project"
                    placeholder="Select a project"
                    disabled={projects.isLoading}
                    error={errors.projectId?.message}
                    options={(projects.data ?? []).map((project) => ({
                      value: project.id,
                      label: `${project.name} (${project.organization?.name})`,
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
                  Queue name
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
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('description')}
              />
              {errors.description && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="priority"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Priority
                </label>
                <Select
                  id="priority"
                  aria-label="Priority"
                  error={errors.priority?.message}
                  options={[0, 1, 2, 3, 4, 5, 10].map((value) => ({
                    value: String(value),
                    label: String(value),
                  }))}
                  {...register('priority')}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="maxConcurrency"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Max concurrency
                </label>
                <Input
                  id="maxConcurrency"
                  type="number"
                  min={1}
                  error={errors.maxConcurrency?.message}
                  {...register('maxConcurrency')}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="rateLimit"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Rate limit / second
                </label>
                <Input
                  id="rateLimit"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  error={errors.rateLimit?.message}
                  {...register('rateLimit')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="retryPolicyId"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Retry policy ID
              </label>
              <Input
                id="retryPolicyId"
                error={errors.retryPolicyId?.message}
                {...register('retryPolicyId')}
              />
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
                  description="A JSON object for queue labels and custom attributes."
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
              <Button type="submit" loading={createQueue.isPending}>
                Create queue
              </Button>
            </div>
          </div>
        </SectionCard>
      </form>
    </DashboardContainer>
  );
}
