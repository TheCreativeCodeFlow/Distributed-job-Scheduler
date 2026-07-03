import React from 'react';
import type { WorkerStatus } from '../../types/worker';

export function WorkerStatusBadge({ status }: { status: WorkerStatus }) {
  const styles: Record<WorkerStatus, string> = {
    REGISTERING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    IDLE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    RUNNING: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    LOST: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    RECOVERING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    OFFLINE: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold select-none ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
