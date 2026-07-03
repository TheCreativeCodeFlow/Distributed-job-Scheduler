'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex flex-col items-center max-w-md gap-4 p-8 border border-border rounded-xl bg-card shadow-xl shadow-black/25">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          404
        </h1>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Page Not Found
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The routing endpoint you are trying to view does not exist or has been
          relocated.
        </p>
        <Link href="/dashboard" className="w-full mt-2">
          <Button className="w-full">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
