import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createOrganizationSchema = {
  body: z.object({
    name: z
      .string()
      .min(1, 'Name must be at least 1 character long.')
      .max(100, 'Name must be less than 100 characters.'),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters long.')
      .max(64, 'Slug must be less than 64 characters.')
      .regex(
        slugRegex,
        'Slug must contain only lowercase alphanumeric characters and single hyphens, and cannot start or end with a hyphen.',
      ),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters.')
      .optional(),
    logoUrl: z.string().url('Logo URL must be a valid URL.').optional(),
    metadata: z.record(z.unknown()).default({}),
  }),
};

export const updateOrganizationSchema = {
  body: z.object({
    name: z
      .string()
      .min(1, 'Name must be at least 1 character long.')
      .max(100, 'Name must be less than 100 characters.')
      .optional(),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters.')
      .optional(),
    logoUrl: z.string().url('Logo URL must be a valid URL.').optional(),
    metadata: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const getOrganizationSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const deleteOrganizationSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const addMemberSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
  body: z.object({
    email: z
      .string()
      .email('Must be a valid email address.')
      .transform((val) => val.toLowerCase().trim()),
    role: z.enum([
      'ORG_OWNER',
      'ORG_ADMIN',
      'PROJECT_MAINTAINER',
      'DEVELOPER',
      'READ_ONLY',
    ]),
  }),
};

export const updateMemberRoleSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
    memberId: z.string().uuid('Invalid member ID format.'),
  }),
  body: z.object({
    role: z.enum([
      'ORG_OWNER',
      'ORG_ADMIN',
      'PROJECT_MAINTAINER',
      'DEVELOPER',
      'READ_ONLY',
    ]),
  }),
};

export const removeMemberSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
    memberId: z.string().uuid('Invalid member ID format.'),
  }),
};

export const listMembersSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const getMemberSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
    memberId: z.string().uuid('Invalid member ID format.'),
  }),
};

export const transferOwnershipSchema = {
  body: z.object({
    targetUserId: z.string().uuid('Invalid target user ID format.'),
  }),
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const updateSettingsSchema = {
  body: z.object({
    metadata: z.record(z.unknown()),
  }),
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const getOrgActivitySchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const getOrgStatsSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const suspendOrgSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const reactivateOrgSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};
