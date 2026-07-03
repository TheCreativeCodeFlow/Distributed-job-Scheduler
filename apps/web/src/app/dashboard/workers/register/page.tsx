'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useRegisterWorker } from '../../../../hooks/use-workers';
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
import { ConfirmationModal } from '../../../../components/ui/confirmation-modal';

const schema = z.object({
  hostname: z.string().min(1, 'Hostname is required.').max(100),
  instanceId: z.string().min(1, 'Instance ID is required.').max(100),
  version: z.string().min(1, 'Version description is required.'),
  maxConcurrency: z.coerce
    .number()
    .int()
    .positive('Max concurrency must be a positive integer.')
    .max(100, 'Maximum allowed concurrency limits is 100.'),
  supportedQueuesRaw: z.string().min(1, 'Enter at least one supported queue.'),
  supportedTagsRaw: z.string().optional(),
  metadata: z.string().superRefine((value, context) => {
    try {
      parseJsonObject(value);
    } catch (error) {
      context.addIssue({ code: 'custom', message: (error as Error).message });
    }
  }),
});

type Values = z.infer<typeof schema>;

export default function RegisterWorkerPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const permissions = queuePermissions(user?.role);
  const registerWorker = useRegisterWorker();
  const [confirmValues, setConfirmValues] = React.useState<Values | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      hostname: '',
      instanceId: '',
      version: '1.0.0',
      maxConcurrency: 10,
      supportedQueuesRaw: 'default',
      supportedTagsRaw: 'cpu,high-memory',
      metadata: '{}',
    },
  });

  if (!permissions.canCreate) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Registration permission required"
          message="Your account is not authorized to register worker nodes manually."
          onRetry={() => router.push('/dashboard/workers')}
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
      const queues = confirmValues.supportedQueuesRaw
        .split(',')
        .map((q) => q.trim())
        .filter(Boolean);
      const tags = (confirmValues.supportedTagsRaw || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const w = await registerWorker.mutateAsync({
        hostname: confirmValues.hostname,
        instanceId: confirmValues.instanceId,
        version: confirmValues.version,
        maxConcurrency: confirmValues.maxConcurrency,
        supportedQueues: queues,
        supportedTags: tags,
        metadata: parseJsonObject(confirmValues.metadata),
      });
      toast.success(
        'Worker registered',
        `Worker node ${w.hostname} registered successfully.`,
      );
      setConfirmValues(null);
      router.push(`/dashboard/workers/${w.id}`);
    } catch {
      toast.error('Registration failed', 'The request could not be processed.');
      setConfirmValues(null);
    }
  };

  return (
    <DashboardContainer>
      <PageHeader
        title="Register Worker"
        description="Manually join a new compute node to the scheduling daemon cluster."
        actions={
          <Button variant="outline" size="sm">
            <Link href="/dashboard/workers" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to workers
            </Link>
          </Button>
        }
      />
      <form onSubmit={triggerConfirm} noValidate className="max-w-3xl">
        <SectionCard title="Node parameters configuration">
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="hostname"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Hostname
                </label>
                <Input
                  id="hostname"
                  placeholder="e.g. worker-node-01.local"
                  error={errors.hostname?.message}
                  {...register('hostname')}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="instanceId"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Instance ID
                </label>
                <Input
                  id="instanceId"
                  placeholder="e.g. i-0abcd1234ef5678"
                  error={errors.instanceId?.message}
                  {...register('instanceId')}
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="version"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Version
                </label>
                <Input
                  id="version"
                  placeholder="e.g. 1.2.0"
                  error={errors.version?.message}
                  {...register('version')}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="maxConcurrency"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Max Concurrency (Slots limit)
                </label>
                <Input
                  id="maxConcurrency"
                  type="number"
                  placeholder="e.g. 8"
                  error={errors.maxConcurrency?.message}
                  {...register('maxConcurrency')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="supportedQueuesRaw"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Supported Queues (Comma-separated)
              </label>
              <Input
                id="supportedQueuesRaw"
                placeholder="e.g. default, billing, critical"
                error={errors.supportedQueuesRaw?.message}
                {...register('supportedQueuesRaw')}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="supportedTagsRaw"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Supported Tags (Comma-separated, optional)
              </label>
              <Input
                id="supportedTagsRaw"
                placeholder="e.g. gpu, high-cpu"
                error={errors.supportedTagsRaw?.message}
                {...register('supportedTagsRaw')}
              />
            </div>
            <Controller
              control={control}
              name="metadata"
              render={({ field }) => (
                <JsonEditor
                  id="metadata"
                  label="Worker Metadata JSON"
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
              <Button type="submit">Register worker</Button>
            </div>
          </div>
        </SectionCard>
      </form>

      <ConfirmationModal
        isOpen={Boolean(confirmValues)}
        onClose={() => setConfirmValues(null)}
        onConfirm={submit}
        title="Confirm Worker Registration"
        message="Deregistered status or concurrency overrides require manual operations. Submit registration credentials?"
        confirmLabel="Register"
      />
    </DashboardContainer>
  );
}
