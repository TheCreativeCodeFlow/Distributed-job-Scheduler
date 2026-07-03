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
import { useSubmitJob } from '../../../../hooks/use-jobs';
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

const schema = z.object({
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
});
type Values = z.infer<typeof schema>;

export default function CreateJobPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);
  const submitJob = useSubmitJob();
  const [confirmValues, setConfirmValues] = React.useState<Values | null>(null);

  const queuesQuery = useQuery<Queue[]>({
    queryKey: ['queues', 'job-selector'],
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
      payload: '{\n  "action": "process",\n  "userId": 1001\n}',
      priority: 1,
      idempotencyKey: '',
      metadata: '{}',
    },
  });

  if (!permissions.canCreate) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Submission permission required"
          message="Your role does not allow manual job submission."
          onRetry={() => router.push('/dashboard/jobs')}
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
      const job = await submitJob.mutateAsync({
        queueId: confirmValues.queueId,
        payload: parseJsonObject(confirmValues.payload),
        priority: confirmValues.priority,
        metadata: parseJsonObject(confirmValues.metadata),
        idempotencyKey: confirmValues.idempotencyKey || undefined,
      });
      toast.success(
        'Job submitted',
        `Job ${job.id.slice(0, 8)} is now queued.`,
      );
      setConfirmValues(null);
      router.push(`/dashboard/jobs/${job.id}`);
    } catch {
      toast.error(
        'Submission failed',
        'The job could not be submitted to the scheduler.',
      );
      setConfirmValues(null);
    }
  };

  return (
    <DashboardContainer>
      <PageHeader
        title="Submit job"
        description="Manually submit a job payload to a scheduler queue."
        actions={
          <Button variant="outline" size="sm">
            <Link href="/dashboard/jobs" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to jobs
            </Link>
          </Button>
        }
      />
      <form onSubmit={triggerConfirm} noValidate className="max-w-3xl">
        <SectionCard title="Job specifications">
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
                  placeholder="e.g. payout_18293712_user4"
                  error={errors.idempotencyKey?.message}
                  {...register('idempotencyKey')}
                />
              </div>
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
                  description="The JSON payload object passed to workers for processing."
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
                  description="A JSON object containing job tags, parameters or context labels."
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
              <Button type="submit">Submit job</Button>
            </div>
          </div>
        </SectionCard>
      </form>

      <ConfirmationModal
        isOpen={Boolean(confirmValues)}
        onClose={() => setConfirmValues(null)}
        onConfirm={submit}
        title="Confirm job submission"
        message="Submit this job payload to the scheduler? It will be picked up by the next available worker."
        confirmLabel="Submit"
      />
    </DashboardContainer>
  );
}
