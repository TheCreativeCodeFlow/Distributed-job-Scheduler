'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.1),rgba(255,255,255,0))]" />
      <Card className="relative z-10 w-full max-w-md bg-card/60 backdrop-blur-md shadow-2xl hoverEffect glow">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-rose-500/10 p-3 text-rose-500">
              <ShieldX className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-bold tracking-tight">
              Access Denied
            </CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              You do not have permission to view this resource.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your current role assignment lacks the required privileges to access
            this page. Please contact your organization administrator if you
            believe this is an error.
          </p>
          <Link href="/dashboard" className="block w-full mt-2">
            <Button className="w-full">Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
