'use client';

import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome to the TaskFlow admin console. Select an operation from the
          sidebar.
        </p>
      </div>
    </div>
  );
}
