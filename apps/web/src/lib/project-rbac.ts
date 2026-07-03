import type { UserRole } from '../types/auth';

const managers: UserRole[] = [
  'SYSTEM_ADMIN',
  'ORG_OWNER',
  'ORG_ADMIN',
  'PROJECT_MAINTAINER',
];

export const projectPermissions = (role?: UserRole) => ({
  canCreate: Boolean(role && managers.includes(role)),
  canConfigure: Boolean(role && managers.includes(role)),
  canArchive: Boolean(role && managers.includes(role)),
  canEditMetadata: Boolean(role && [...managers, 'DEVELOPER'].includes(role)),
});
