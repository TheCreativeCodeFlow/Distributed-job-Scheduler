'use client';

import React from 'react';
import {
  Archive,
  Ban,
  CirclePlay,
  Gauge,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/button';
import { ConfirmationModal } from '../ui/confirmation-modal';
import { operationLabels, queueTransitions } from '../../lib/queue-state';
import { useQueueOperation } from '../../hooks/use-queues';
import { useToast } from '../feedback/toasts';
import type { Queue, QueueOperation } from '../../types/queue';

const icons: Record<QueueOperation, React.ReactNode> = {
  pause: <Pause className="h-4 w-4" />,
  resume: <CirclePlay className="h-4 w-4" />,
  drain: <Gauge className="h-4 w-4" />,
  disable: <Ban className="h-4 w-4" />,
  enable: <CirclePlay className="h-4 w-4" />,
  archive: <Archive className="h-4 w-4" />,
  restore: <RotateCcw className="h-4 w-4" />,
};

export function QueueControls({
  queue,
  canOperate,
  compact = false,
}: {
  queue: Queue;
  canOperate: boolean;
  compact?: boolean;
}) {
  const [pending, setPending] = React.useState<QueueOperation | null>(null);
  const mutation = useQueueOperation();
  const toast = useToast();
  if (!canOperate) return null;
  const operations = queueTransitions[queue.status];

  const confirm = async () => {
    if (!pending) return;
    await mutation.mutateAsync({ queue, operation: pending });
    toast.success(
      `Queue ${operationLabels[pending].toLowerCase()}d`,
      `${queue.name} is now updated.`,
    );
  };

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-2"
        aria-label="Queue operational controls"
      >
        {operations.map((operation) => (
          <Button
            key={operation}
            size={compact ? 'icon' : 'sm'}
            variant={
              operation === 'archive' || operation === 'disable'
                ? 'destructive'
                : 'outline'
            }
            aria-label={`${operationLabels[operation]} ${queue.name}`}
            title={operationLabels[operation]}
            onClick={() => setPending(operation)}
          >
            {icons[operation]}
            {!compact && operationLabels[operation]}
          </Button>
        ))}
      </div>
      <ConfirmationModal
        isOpen={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        title={`${pending ? operationLabels[pending] : ''} queue`}
        message={`${pending ? operationLabels[pending] : 'Update'} ${queue.name}? This changes how the scheduler accepts and processes work.`}
        confirmLabel={pending ? operationLabels[pending] : 'Confirm'}
        isDestructive={
          pending === 'archive' || pending === 'disable' || pending === 'drain'
        }
      />
    </>
  );
}
