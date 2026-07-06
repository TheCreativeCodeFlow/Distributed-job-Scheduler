'use client';

import React from 'react';
import { useSSEConnection } from '../../lib/live/useSSEConnection';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ConnectionIndicator() {
  const { status, lastEventAt, reconnect } = useSSEConnection();
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Map state to indicator colors and labels
  let dotColor = 'bg-rose-500 shadow-rose-500/50';
  let pillText = 'Disconnected';
  let isPulsing = false;

  if (status === 'connected') {
    dotColor = 'bg-emerald-500 shadow-emerald-500/50';
    pillText = 'Live';
  } else if (status === 'connecting' || status === 'reconnecting') {
    dotColor = 'bg-amber-500 shadow-amber-500/50';
    pillText = status === 'connecting' ? 'Connecting' : 'Reconnecting';
    isPulsing = true;
  } else if (status === 'polling-fallback') {
    dotColor = 'bg-blue-500 shadow-blue-500/50';
    pillText = 'Polling';
  }

  const formatLastEvent = () => {
    if (!lastEventAt) return 'Never';
    return lastEventAt.toLocaleTimeString();
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={reconnect}
        className={cn(
          'flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md transition-all duration-300 hover:bg-secondary/80 focus:outline-none focus:ring-1 focus:ring-primary/30',
          isPulsing && 'border-amber-500/30',
        )}
        aria-label={`Connection status: ${pillText}. Click to reconnect.`}
      >
        <span className={cn('relative flex h-2 w-2')}>
          {(status === 'connecting' || status === 'reconnecting') && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
          )}
          {status === 'connected' && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40"></span>
          )}
          <span
            className={cn(
              'relative inline-flex h-2 w-2 rounded-full',
              dotColor,
            )}
          ></span>
        </span>
        <span className="select-none tracking-tight text-muted-foreground hover:text-foreground">
          {pillText}
        </span>
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-lg border border-border bg-card p-3 shadow-lg shadow-black/20 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">
                SSE Connection:
              </span>
              <span
                className={cn(
                  'font-bold capitalize',
                  status === 'connected' && 'text-emerald-500',
                  status === 'connecting' && 'text-amber-500',
                  status === 'reconnecting' && 'text-amber-500',
                  status === 'disconnected' && 'text-rose-500',
                  status === 'polling-fallback' && 'text-blue-500',
                )}
              >
                {status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">
                Last Event:
              </span>
              <span className="font-bold text-foreground">
                {formatLastEvent()}
              </span>
            </div>
            <div className="border-t border-border/60 my-1 pt-1.5">
              <button
                onClick={reconnect}
                className="flex w-full items-center justify-center gap-1.5 rounded bg-primary/10 py-1 font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Reconnect SSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ConnectionIndicator;
