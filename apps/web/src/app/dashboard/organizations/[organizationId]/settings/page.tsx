'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../../../services/api-client';
import { useToast } from '../../../../../components/feedback/toasts';
import { PageHeader } from '../../../../../components/layout/page-header';
import { DashboardContainer } from '../../../../../components/layout/dashboard-container';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Button } from '../../../../../components/ui/button';
import { ConfirmationModal } from '../../../../../components/ui/confirmation-modal';
import {
  LoadingState,
  ErrorState,
} from '../../../../../components/feedback/states';
import { Building2, ShieldAlert, KeyRound, Skull } from 'lucide-react';

const settingsSchema = z.object({
  name: z
    .string()
    .min(1, 'Name must be at least 1 character long.')
    .max(100, 'Name must be less than 100 characters.'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters.')
    .optional(),
});

type SettingsInput = z.infer<typeof settingsSchema>;

export default function OrganizationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const organizationId = params.organizationId as string;

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showSuspendModal, setShowSuspendModal] = React.useState(false);
  const [targetUserId, setTargetUserId] = React.useState('');

  const {
    data: org,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['organizations', organizationId],
    queryFn: async () => {
      const response = await apiClient.get(`/organizations/${organizationId}`);
      return response.data;
    },
    enabled: !!organizationId,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
  });

  React.useEffect(() => {
    if (org) {
      setValue('name', org.name);
      setValue('description', org.description || '');
    }
  }, [org, setValue]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SettingsInput) => {
      const response = await apiClient.patch(
        `/organizations/${organizationId}`,
        data,
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(
        'Settings Updated',
        `Successfully saved configurations for organization ${data.name}.`,
      );
      queryClient.invalidateQueries({
        queryKey: ['organizations', organizationId],
      });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(
        'Update Failed',
        err.response?.data?.detail || 'An error occurred updating settings.',
      );
    },
  });

  // Suspend/Reactivate mutation
  const suspendMutation = useMutation({
    mutationFn: async () => {
      const action = org?.isSuspended ? 'reactivate' : 'suspend';
      const response = await apiClient.post(
        `/organizations/${organizationId}/${action}`,
      );
      return response.data;
    },
    onSuccess: () => {
      const actionLabel = org?.isSuspended ? 'reactivated' : 'suspended';
      toast.success(
        'Organization Status Updated',
        `Successfully ${actionLabel} the organization.`,
      );
      queryClient.invalidateQueries({
        queryKey: ['organizations', organizationId],
      });
      setShowSuspendModal(false);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(
        'Status Update Failed',
        err.response?.data?.detail || 'An error occurred.',
      );
    },
  });

  // Transfer ownership mutation
  const transferMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/organizations/${organizationId}/transfer-ownership`,
        {
          targetUserId,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success(
        'Ownership Transferred',
        'Successfully transferred ownership of this organization.',
      );
      queryClient.invalidateQueries({
        queryKey: ['organizations', organizationId],
      });
      setTargetUserId('');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(
        'Transfer Failed',
        err.response?.data?.detail ||
          'An error occurred transferring ownership.',
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/organizations/${organizationId}`);
    },
    onSuccess: () => {
      toast.success(
        'Organization Deleted',
        'Soft delete operations completed successfully.',
      );
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      router.push('/dashboard/organizations');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(
        'Delete Failed',
        err.response?.data?.detail || 'An error occurred during soft deletion.',
      );
    },
  });

  if (error) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Organization Missing"
          message="An error occurred while loading settings for this organization."
          onRetry={() => router.back()}
        />
      </DashboardContainer>
    );
  }

  if (isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Loading settings configurations..." />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <PageHeader
        title="Organization Settings"
        description={`Manage settings, members permissions, and credentials metadata for ${org?.name}.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/40 pb-4 mb-4 bg-muted/5">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Basic Profile Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="name-input"
                    className="text-xs font-bold text-muted-foreground uppercase"
                  >
                    Organization Name
                  </label>
                  <Input
                    id="name-input"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="desc-input"
                    className="text-xs font-bold text-muted-foreground uppercase"
                  >
                    Description
                  </label>
                  <textarea
                    id="desc-input"
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-shadow"
                    {...register('description')}
                  />
                  {errors.description && (
                    <span className="text-xs font-semibold text-destructive">
                      {errors.description.message}
                    </span>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={updateMutation.isPending}>
                    Save Profile Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Transfer Ownership Card */}
          <Card className="bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/40 pb-4 mb-4 bg-muted/5">
              <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Transfer Ownership
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Atomically hand over organization ownership to another
                registered user ID. This is a final action.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Target User UUID"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  aria-label="Target User UUID"
                />
                <Button
                  onClick={() => transferMutation.mutate()}
                  disabled={!targetUserId}
                  loading={transferMutation.isPending}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Administration Danger Zones */}
        <div className="space-y-6">
          <Card className="border-rose-500/20 bg-rose-500/5 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-rose-500/10 pb-4 mb-4 bg-rose-500/5">
              <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold text-rose-900 dark:text-rose-400">
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Suspend reactivate */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground uppercase">
                  {org?.isSuspended
                    ? 'Reactivate Organization'
                    : 'Suspend Organization'}
                </h5>
                <p className="text-xxs text-muted-foreground leading-relaxed">
                  {org?.isSuspended
                    ? 'Restore full operation access permissions to the members of this tenant organization.'
                    : 'Prevent all members of this organization from accessing dashboard resources.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSuspendModal(true)}
                  className="w-full font-bold"
                >
                  {org?.isSuspended ? 'Reactivate Tenant' : 'Suspend Tenant'}
                </Button>
              </div>

              <div className="border-t border-rose-500/10 my-4" />

              {/* Soft Delete */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground uppercase flex items-center gap-1">
                  <Skull className="h-3.5 w-3.5" />
                  Soft Delete Organization
                </h5>
                <p className="text-xxs text-muted-foreground leading-relaxed">
                  Permanently soft delete this organization tenant, cleaning up
                  all project and worker assets.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full font-bold"
                >
                  Delete Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={async () => {
          await suspendMutation.mutateAsync();
        }}
        title={
          org?.isSuspended
            ? 'Reactivate Organization?'
            : 'Suspend Organization?'
        }
        message={
          org?.isSuspended
            ? 'This will reactivate operations access permissions for all members of this organization.'
            : 'This will temporarily block access to dashboard and scheduling resources for all members.'
        }
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
        title="Soft Delete Organization?"
        message="Are you absolutely sure you want to soft delete this organization tenant? This operation will terminate all running job tasks."
        confirmLabel="Confirm Delete"
        isDestructive
      />
    </DashboardContainer>
  );
}
