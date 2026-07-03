'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../services/api-client';
import { useToast } from '../../../../components/feedback/toasts';
import { PageHeader } from '../../../../components/layout/page-header';
import { DashboardContainer } from '../../../../components/layout/dashboard-container';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Building2 } from 'lucide-react';

const orgSchema = z.object({
  name: z
    .string()
    .min(1, 'Name must be at least 1 character long.')
    .max(100, 'Name must be less than 100 characters.'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters long.')
    .max(64, 'Slug must be less than 64 characters.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase alphanumeric characters and single hyphens, and cannot start or end with a hyphen.',
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters.')
    .optional(),
});

type OrgInput = z.infer<typeof orgSchema>;

export default function CreateOrganizationPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrgInput>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  const nameVal = watch('name');

  // Auto-generate slug from name unless user modifies it
  React.useEffect(() => {
    if (nameVal) {
      const slugified = nameVal
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', slugified, { shouldValidate: true });
    }
  }, [nameVal, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: OrgInput) => {
      const response = await apiClient.post('/organizations', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(
        'Organization Created',
        `Successfully initialized organization ${data.name}.`,
      );
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      router.push('/dashboard/organizations');
    },
    onError: (err: any) => {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        'An error occurred during organization creation.';
      toast.error('Creation Failed', detail);
    },
  });

  const onSubmit = (data: OrgInput) => {
    mutation.mutate(data);
  };

  return (
    <DashboardContainer>
      <PageHeader
        title="Create Organization"
        description="Register a new organization tenant within the Distributed Job Scheduler."
      />

      <Card className="max-w-2xl bg-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border/40 pb-4 mb-4 bg-muted/5">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">
            Organization Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="name-input"
                className="text-xs font-bold text-muted-foreground uppercase"
              >
                Organization Name
              </label>
              <Input
                id="name-input"
                placeholder="e.g. Acme Corporation"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="slug-input"
                className="text-xs font-bold text-muted-foreground uppercase"
              >
                Unique Slug
              </label>
              <Input
                id="slug-input"
                placeholder="e.g. acme-corp"
                error={errors.slug?.message}
                {...register('slug')}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="desc-input"
                className="text-xs font-bold text-muted-foreground uppercase"
              >
                Description (Optional)
              </label>
              <textarea
                id="desc-input"
                placeholder="Write a brief description of this organization tenant..."
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-shadow"
                {...register('description')}
              />
              {errors.description && (
                <span className="text-xs font-semibold text-destructive">
                  {errors.description.message}
                </span>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                Create Tenant
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardContainer>
  );
}
