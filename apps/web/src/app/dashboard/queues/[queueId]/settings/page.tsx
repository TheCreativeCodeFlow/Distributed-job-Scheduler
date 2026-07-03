'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useQueue, useUpdateQueue } from '../../../../../hooks/use-queues';
import { useAuth } from '../../../../../providers/auth-provider';
import { queuePermissions } from '../../../../../lib/queue-state';
import { useToast } from '../../../../../components/feedback/toasts';
import {
  JsonEditor,
  parseJsonObject,
} from '../../../../../components/projects/project-fields';
import { QueueControls } from '../../../../../components/queues/queue-controls';
import { QueueStatus } from '../../../../../components/queues/queue-status';
import { DashboardContainer } from '../../../../../components/layout/dashboard-container';
import { PageHeader } from '../../../../../components/layout/page-header';
import {
  ErrorState,
  LoadingState,
} from '../../../../../components/feedback/states';
import { SectionCard } from '../../../../../components/ui/section-card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500),
  priority: z.coerce.number().int().nonnegative(),
  maxConcurrency: z.coerce.number().int().positive(),
  rateLimit: z.union([z.literal(''), z.coerce.number().int().positive()]),
  metadata: z.string().superRefine((value, context) => {
    try {
      parseJsonObject(value);
    } catch (error) {
      context.addIssue({ code: 'custom', message: (error as Error).message });
    }
  }),
});
type Values = z.infer<typeof schema>;

export default function QueueSettingsPage() {
  const queueId = useParams<{ queueId: string }>().queueId;
  const router = useRouter();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);
  const toast = useToast();
  const queueQuery = useQueue(queueId);
  const updateQueue = useUpdateQueue();
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  React.useEffect(() => {
    if (queueQuery.data)
      reset({
        name: queueQuery.data.name,
        description: queueQuery.data.description ?? '',
        priority: queueQuery.data.priority,
        maxConcurrency: queueQuery.data.maxConcurrency,
        rateLimit: queueQuery.data.rateLimit ?? '',
        metadata: JSON.stringify(queueQuery.data.metadata ?? {}, null, 2),
      });
  }, [queueQuery.data, reset]);

  if (queueQuery.isLoading)
    return (
      <DashboardContainer>
        <LoadingState message="Loading queue settings…" />
      </DashboardContainer>
    );
  if (queueQuery.error || !queueQuery.data || !permissions.canEditMetadata)
    return (
      <DashboardContainer>
        <ErrorState
          title="Settings unavailable"
          message="The queue could not be loaded or your role cannot edit it."
          onRetry={() => router.push(`/dashboard/queues/${queueId}`)}
        />
      </DashboardContainer>
    );
  const queue = queueQuery.data;

  const submit = handleSubmit(async (values) => {
    try {
      await updateQueue.mutateAsync({
        queueId,
        updates: permissions.canConfigure
          ? {
              name: values.name,
              description: values.description,
              priority: values.priority,
              maxConcurrency: values.maxConcurrency,
              ...(values.rateLimit === ''
                ? {}
                : { rateLimit: values.rateLimit }),
              metadata: parseJsonObject(values.metadata),
            }
          : { metadata: parseJsonObject(values.metadata) },
      });
      toast.success('Queue updated', 'Configuration changes were saved.');
      await queueQuery.refetch();
    } catch {
      toast.error('Update failed', 'Queue configuration could not be saved.');
    }
  });

  return (
    <DashboardContainer>
      <PageHeader
        title={`${queue.name} settings`}
        description={
          permissions.canConfigure
            ? 'Manage queue configuration and operational state.'
            : 'Your Developer role can edit metadata only.'
        }
        actions={
          <div className="flex items-center gap-2">
            <QueueStatus status={queue.status} />
            <Button variant="outline" size="sm">
              <Link
                href={`/dashboard/queues/${queueId}`}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Queue details
              </Link>
            </Button>
          </div>
        }
      />
      <form className="max-w-3xl space-y-6" onSubmit={submit}>
        <SectionCard title="Queue configuration">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Queue name
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
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="priority"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Priority
                </label>
                <Input
                  id="priority"
                  type="number"
                  min={0}
                  disabled={!permissions.canConfigure}
                  error={errors.priority?.message}
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
                  disabled={!permissions.canConfigure}
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
                  disabled={!permissions.canConfigure}
                  error={errors.rateLimit?.message}
                  {...register('rateLimit')}
                />
              </div>
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
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!isDirty}
                loading={updateQueue.isPending}
              >
                Save changes
              </Button>
            </div>
          </div>
        </SectionCard>
      </form>
      {permissions.canOperate && (
        <div className="mt-6 max-w-3xl">
          <SectionCard
            title="Operational controls"
            description="Only transitions valid for the current state are available. Every action requires confirmation."
          >
            <QueueControls queue={queue} canOperate />
          </SectionCard>
        </div>
      )}
    </DashboardContainer>
  );
}
