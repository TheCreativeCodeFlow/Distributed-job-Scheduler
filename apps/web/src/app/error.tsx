'use client';

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled next.js page crash:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex flex-col items-center max-w-md gap-4 p-8 border border-border rounded-xl bg-card shadow-xl shadow-black/25">
        <div className="p-3 rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          500
        </h1>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Internal Server Error
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          An unhandled error occurred while trying to process this request.
        </p>
        {error.message && (
          <pre className="w-full overflow-x-auto rounded bg-muted/40 p-3 text-left text-xs font-semibold text-rose-400 border border-border">
            {error.message}
          </pre>
        )}
        <Button onClick={reset} className="w-full mt-2">
          Retry Request
        </Button>
      </div>
    </div>
  );
}
