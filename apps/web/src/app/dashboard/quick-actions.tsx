'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  PlusCircle,
  Play,
  Building2,
  FolderKanban,
  ListPlus,
} from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <Card className="bg-card/60 backdrop-blur-md">
      <CardHeader className="border-b border-border/40 pb-4 mb-4 bg-muted/5">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-primary" />
          Quick Actions Console
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Link href="/dashboard/organizations" className="w-full">
          <Button
            variant="outline"
            className="w-full justify-start text-xs gap-3.5 h-12 hover:bg-primary/5 focus:ring-1"
          >
            <Building2 className="h-4.5 w-4.5 text-primary" />
            Create Organization
          </Button>
        </Link>
        <Link href="/dashboard/projects" className="w-full">
          <Button
            variant="outline"
            className="w-full justify-start text-xs gap-3.5 h-12 hover:bg-violet-500/5 focus:ring-1"
          >
            <FolderKanban className="h-4.5 w-4.5 text-violet-400" />
            Create Project
          </Button>
        </Link>
        <Link href="/dashboard/queues" className="w-full">
          <Button
            variant="outline"
            className="w-full justify-start text-xs gap-3.5 h-12 hover:bg-emerald-500/5 focus:ring-1"
          >
            <ListPlus className="h-4.5 w-4.5 text-emerald-400" />
            Create Queue
          </Button>
        </Link>
        <Link href="/dashboard/jobs" className="w-full">
          <Button className="w-full justify-start text-xs gap-3.5 h-12 shadow-sm focus:ring-1">
            <Play className="h-4.5 w-4.5 text-primary-foreground fill-primary-foreground" />
            Submit New Job
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
export default QuickActions;
