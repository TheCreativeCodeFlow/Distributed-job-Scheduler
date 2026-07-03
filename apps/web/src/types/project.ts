export type MembershipRole =
  | 'SYSTEM_ADMIN'
  | 'ORG_OWNER'
  | 'ORG_ADMIN'
  | 'PROJECT_MAINTAINER'
  | 'DEVELOPER'
  | 'READ_ONLY';

export interface ProjectOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  metadata: Record<string, unknown>;
  settings: Record<string, unknown>;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: ProjectOrganization;
  queueCount?: number;
}

export interface ProjectQueue {
  id: string;
  name: string;
  slug: string;
  status: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListParams {
  organizationId?: string;
  search?: string;
  status?: 'active' | 'archived' | 'inactive' | 'all';
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'organization' | 'createdAt' | 'updatedAt' | 'queueCount';
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectListResult {
  items: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProjectInput {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  metadata: Record<string, unknown>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}
