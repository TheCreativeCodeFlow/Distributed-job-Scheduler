import { z } from 'zod';

export const createInvitationSchema = {
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

export const listInvitationsSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
  }),
};

export const getInvitationSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
    invitationId: z.string().uuid('Invalid invitation ID format.'),
  }),
};

export const revokeInvitationSchema = {
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format.'),
    invitationId: z.string().uuid('Invalid invitation ID format.'),
  }),
};

export const acceptInvitationSchema = {
  params: z.object({
    token: z.string().min(10, 'Invalid token format.'),
  }),
};

export const declineInvitationSchema = {
  params: z.object({
    token: z.string().min(10, 'Invalid token format.'),
  }),
};
