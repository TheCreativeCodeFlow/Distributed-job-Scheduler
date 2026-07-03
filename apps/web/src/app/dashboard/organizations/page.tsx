'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../services/api-client';
import { PageHeader } from '../../../components/layout/page-header';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { DataTable } from '../../../components/tables/data-table';
import { LoadingState, ErrorState } from '../../../components/feedback/states';
import { Building2, Plus, ArrowRight, Settings, Search } from 'lucide-react';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export default function OrganizationsListPage() {
  const [search, setSearch] = React.useState('');

  const {
    data: organizations = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await apiClient.get('/organizations');
      return response.data;
    },
  });

  const filteredOrgs = React.useMemo(() => {
    return organizations.filter((org) =>
      org.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [organizations, search]);

  if (error) {
    return (
      <DashboardContainer>
        <ErrorState
          title="Failed to Load Organizations"
          message="An error occurred while connecting to the organizations directory service."
          onRetry={() => refetch()}
        />
      </DashboardContainer>
    );
  }

  if (isLoading) {
    return (
      <DashboardContainer>
        <LoadingState message="Loading organizations directory..." />
      </DashboardContainer>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Organization Name',
      render: (row: Organization) => (
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{row.name}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              slug: {row.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: Organization) => {
        if (row.isSuspended) {
          return (
            <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-xxs font-extrabold text-rose-400">
              SUSPENDED
            </span>
          );
        }
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xxs font-extrabold text-emerald-400">
            ACTIVE
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (row: Organization) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Organization) => (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/organizations/${row.id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              View Console
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
          <Link href={`/dashboard/organizations/${row.id}/settings`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DashboardContainer>
      <PageHeader
        title="Organizations Directory"
        description="View and administer tenant organizations within the system cluster."
        actions={
          <Link href="/dashboard/organizations/create">
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
          </Link>
        }
      />

      <div className="relative max-w-md mb-4 select-none">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Filter organizations by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Filter organizations"
        />
      </div>

      <DataTable data={filteredOrgs} columns={columns} />
    </DashboardContainer>
  );
}
export type { Organization };
