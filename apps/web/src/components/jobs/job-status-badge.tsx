import React from 'react';
import { Badge } from '../ui/badge';
import type { JobStatus } from '../../types/job';

const variants = {
  QUEUED: 'info',
  CLAIMED: 'default',
  RUNNING: 'info',
  COMPLETED: 'success',
  FAILED: 'destructive',
  CANCELLED: 'secondary',
  RETRY_PENDING: 'warning',
  SCHEDULED: 'warning',
  DEAD_LETTER: 'destructive',
  RETRY_EXHAUSTED: 'destructive',
} as const;

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge
      variant={variants[status] || 'outline'}
      className="font-mono text-[10px] font-bold"
    >
      {status}
    </Badge>
  );
}
