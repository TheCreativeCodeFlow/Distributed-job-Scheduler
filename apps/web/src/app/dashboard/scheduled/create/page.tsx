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
import { useCreateScheduledJob } from '../../../../hooks/use-scheduled-jobs';
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
import { ConfirmationModal } from '../../../../components/ui/confirmation-modal';
import type { Project, ProjectOrganization } from '../../../../types/project';
import type { Queue } from '../../../../types/queue';

const schema = z
  .object({
    queueId: z.string().uuid('Select a target queue.'),
    payload: z.string().superRefine((value, context) => {
      try {
        parseJsonObject(value);
      } catch (error) {
        context.addIssue({ code: 'custom', message: (error as Error).message });
      }
    }),
    priority: z.coerce
      .number()
      .int()
      .positive('Priority must be a positive integer.'),
    idempotencyKey: z.string().trim().optional(),
    metadata: z.string().superRefine((value, context) => {
      try {
        parseJsonObject(value);
      } catch (error) {
        context.addIssue({ code: 'custom', message: (error as Error).message });
      }
    }),
    executeAt: z.string().optional(),
    delay: z.union([
      z.literal(''),
      z.coerce.number().int().positive('Delay must be a positive integer.'),
    ]),
  })
  .refine(
    (data) => {
      const hasExecuteAt = Boolean(data.executeAt);
      const hasDelay = data.delay !== '';
      return (hasExecuteAt || hasDelay) && !(hasExecuteAt && hasDelay);
    },
    {
      message: 'You must specify either executeAt or delay, but not both.',
      path: ['executeAt'],
    },
  );

type Values = z.infer<typeof schema>;

export default function CreateScheduledJobPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);
  const createScheduled = useCreateScheduledJob();
  const [confirmValues, setConfirmValues] = React.useState<Values | null>(null);

  const queuesQuery = useQuery<Queue[]>({
    queryKey: ['queues', 'scheduled-creator-selector'],
    queryFn: async () => {
      const orgs = (await apiClient.get('/organizations'))
        .data as ProjectOrganization[];
      const groups = await Promise.all(
        orgs.map(async (org) => {
          const projs = (
            await apiClient.get(`/organizations/${org.id}/projects`)
          ).data as Project[];
          return Promise.all(
            projs
              .filter((p) => p.isActive && !p.isArchived)
              .map(async (p) => {
                const qs = (await apiClient.get(`/projects/${p.id}/queues`))
                  .data as Queue[];
                return qs.map((q) => ({ ...q, project: p, organization: org }));
              }),
          );
        }),
      );
      return groups.flat(2);
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      queueId: '',
      payload: '{\n  "action": "delayed_sync",\n  "target": "all"\n}',
      priority: 1,
      idempotencyKey: '',
      metadata: '{}',
      executeAt: '',
      delay: '',
    },
  });

  if (!permissions.canCreate) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Scheduling permission required"
          message="Your role does not allow manual job scheduling."
          onRetry={() => router.push('/dashboard/scheduled')}
        />
      </DashboardContainer>
    );
  }

  const triggerConfirm = handleSubmit((values) => {
    setConfirmValues(values);
  });

  const submit = async () => {
    if (!confirmValues) return;
    try {
      const sj = await createScheduled.mutateAsync({
        queueId: confirmValues.queueId,
        payload: parseJsonObject(confirmValues.payload),
        priority: confirmValues.priority,
        metadata: parseJsonObject(confirmValues.metadata),
        idempotencyKey: confirmValues.idempotencyKey || undefined,
        executeAt: confirmValues.executeAt
          ? new Date(confirmValues.executeAt).toISOString()
          : undefined,
        delay: confirmValues.delay === '' ? undefined : confirmValues.delay,
      });
      toast.success(
        'Job scheduled',
        `Scheduled Job ${sj.id.slice(0, 8)} created successfully.`,
      );
      setConfirmValues(null);
      router.push(`/dashboard/scheduled/${sj.id}`);
    } catch {
      toast.error(
        'Scheduling failed',
        'The delayed job could not be registered.',
      );
      setConfirmValues(null);
    }
  };

  return (
    <DashboardContainer>
      <PageHeader
        title="Schedule job"
        description="Configure a delayed or future scheduled job."
        actions={
          <Button variant="outline" size="sm">
            <Link
              href="/dashboard/scheduled"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to scheduled jobs
            </Link>
          </Button>
        }
      />
      <form onSubmit={triggerConfirm} noValidate className="max-w-3xl">
        <SectionCard title="Scheduling configuration">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="queueId"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Target Queue
              </label>
              <Controller
                control={control}
                name="queueId"
                render={({ field }) => (
                  <Select
                    {...field}
                    id="queueId"
                    aria-label="Target Queue"
                    placeholder="Select a queue"
                    disabled={queuesQuery.isLoading}
                    error={errors.queueId?.message}
                    options={(queuesQuery.data ?? []).map((q) => ({
                      value: q.id,
                      label: `${q.name} (${q.project?.name} - ${q.organization?.name})`,
                    }))}
                  />
                )}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
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
                  options={[1, 2, 3, 4, 5, 10].map((value) => ({
                    value: String(value),
                    label: String(value),
                  }))}
                  {...register('priority')}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="idempotencyKey"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Idempotency Key (Optional)
                </label>
                <Input
                  id="idempotencyKey"
                  placeholder="e.g. payout_delayed_18293"
                  error={errors.idempotencyKey?.message}
                  {...register('idempotencyKey')}
                />
              </div>
            </div>

            {/* Mutual Exclusivity Section */}
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 space-y-4">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Delay Trigger Configuration
              </p>
              <p className="text-xs text-muted-foreground">
                Provide either a specific future execution date OR a delay
                duration (in seconds).
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="executeAt"
                    className="text-xs font-bold uppercase text-muted-foreground"
                  >
                    Execute At (Datetime)
                  </label>
                  <Input
                    id="executeAt"
                    type="datetime-local"
                    error={errors.executeAt?.message}
                    {...register('executeAt')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="delay"
                    className="text-xs font-bold uppercase text-muted-foreground"
                  >
                    Delay (Seconds)
                  </label>
                  <Input
                    id="delay"
                    type="number"
                    min={1}
                    placeholder="e.g. 300"
                    error={errors.delay?.message}
                    {...register('delay')}
                  />
                </div>
              </div>
              {errors.root?.message && (
                <p className="text-xs font-semibold text-destructive">
                  {errors.root.message}
                </p>
              )}
            </div>

            <Controller
              control={control}
              name="payload"
              render={({ field }) => (
                <JsonEditor
                  id="payload"
                  label="Job Payload JSON"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.payload?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="metadata"
              render={({ field }) => (
                <JsonEditor
                  id="metadata"
                  label="Job Metadata JSON"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.metadata?.message}
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
              <Button type="submit">Schedule job</Button>
            </div>
          </div>
        </SectionCard>
      </form>

      <ConfirmationModal
        isOpen={Boolean(confirmValues)}
        onClose={() => setConfirmValues(null)}
        onConfirm={submit}
        title="Confirm job scheduling"
        message="Submit this delayed job to the scheduler? It will be promoted to the queue at the specified time."
        confirmLabel="Schedule"
      />
    </DashboardContainer>
  );
}
