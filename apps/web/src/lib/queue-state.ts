import type { QueueOperation, QueueStatus } from '../types/queue';
import type { UserRole } from '../types/auth';

export const queueTransitions: Record<QueueStatus, QueueOperation[]> = {
  ACTIVE: ['pause', 'drain', 'disable', 'archive'],
  PAUSED: ['resume', 'drain', 'disable', 'archive'],
  DRAINING: ['resume', 'pause', 'disable', 'archive'],
  DISABLED: ['enable', 'archive'],
  ARCHIVED: ['restore'],
};

const operators: UserRole[] = [
  'SYSTEM_ADMIN',
  'ORG_OWNER',
  'ORG_ADMIN',
  'PROJECT_MAINTAINER',
];

export function queuePermissions(role?: UserRole) {
  return {
    canCreate: Boolean(role && operators.includes(role)),
    canConfigure: Boolean(role && operators.includes(role)),
    canOperate: Boolean(role && operators.includes(role)),
    canEditMetadata: Boolean(
      role && [...operators, 'DEVELOPER'].includes(role),
    ),
  };
}

export const operationLabels: Record<QueueOperation, string> = {
  archive: 'Archive',
  restore: 'Restore',
  pause: 'Pause',
  resume: 'Resume',
  drain: 'Drain',
  enable: 'Enable',
  disable: 'Disable',
};
