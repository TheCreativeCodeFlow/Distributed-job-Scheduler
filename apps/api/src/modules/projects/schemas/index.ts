import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createProjectSchema = {
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
      )
      .transform((val) => val.toLowerCase().trim()),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters.')
      .optional(),
    metadata: z.record(z.unknown()).default({}),
    settings: z.record(z.unknown()).default({}),
  }),
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const listProjectsSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const getProjectSchema = {
  params: z.object({
    projectId: z.string().uuid('Invalid project ID format.'),
  }),
};

export const updateProjectSchema = {
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
    metadata: z.record(z.unknown()).optional(),
    settings: z.record(z.unknown()).optional(),
  }),
  params: z.object({
    projectId: z.string().uuid('Invalid project ID format.'),
  }),
};

export const archiveProjectSchema = {
  params: z.object({
    projectId: z.string().uuid('Invalid project ID format.'),
  }),
};

export const restoreProjectSchema = {
  params: z.object({
    projectId: z.string().uuid('Invalid project ID format.'),
  }),
};

export const updateProjectSettingsSchema = {
  body: z.object({
    settings: z.record(z.unknown()),
  }),
  params: z.object({
    projectId: z.string().uuid('Invalid project ID format.'),
  }),
};
