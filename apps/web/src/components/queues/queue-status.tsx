import { Badge } from '../ui/badge';
import type { QueueStatus as Status } from '../../types/queue';

const variants = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  DRAINING: 'info',
  DISABLED: 'secondary',
  ARCHIVED: 'destructive',
} as const;

export function QueueStatus({ status }: { status: Status }) {
  return <Badge variant={variants[status]}>{status}</Badge>;
}
