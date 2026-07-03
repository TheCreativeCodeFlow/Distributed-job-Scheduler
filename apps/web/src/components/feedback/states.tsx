import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No records found',
  message = 'Get started by creating a new entity or adjusting your filters.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-border/80 bg-card/45 select-none">
      <div className="rounded-full bg-muted/40 p-4 text-muted-foreground mb-4">
        <Inbox className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-foreground tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading this dashboard partition. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-destructive/20 bg-destructive/5 select-none">
      <div className="rounded-full bg-destructive/10 p-4 text-destructive mb-4 animate-pulse">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-foreground tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = 'Fetching data resources...',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-border/60 bg-card/25 select-none">
      <div className="text-primary mb-3 animate-spin">
        <Loader2 className="h-8 w-8" />
      </div>
      <p className="text-xs font-semibold text-muted-foreground">{message}</p>
    </div>
  );
}
