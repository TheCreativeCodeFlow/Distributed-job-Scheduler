'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  GitCommit,
  FileCode,
  Play,
  AlertTriangle,
  ShieldCheck,
  Database,
  Cpu,
  Skull,
  ArrowRight,
} from 'lucide-react';
import { useCombinedActivityEvents } from '../../../hooks/use-activity';
import { DashboardContainer } from '../../../components/layout/dashboard-container';
import { PageHeader } from '../../../components/layout/page-header';
import { SectionCard } from '../../../components/ui/section-card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { RelativeTime } from '../../../components/activity/relative-time';
import { Badge } from '../../../components/ui/badge';

const getEventIcon = (event: string) => {
  const ev = event.toLowerCase();
  if (ev.includes('submitted'))
    return <FileCode className="h-4 w-4 text-primary" />;
  if (ev.includes('queued'))
    return <Database className="h-4 w-4 text-sky-500" />;
  if (ev.includes('running'))
    return <Play className="h-4 w-4 text-emerald-500" />;
  if (ev.includes('completed'))
    return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
  if (ev.includes('failed'))
    return <AlertTriangle className="h-4 w-4 text-rose-500" />;
  if (ev.includes('retry'))
    return <GitCommit className="h-4 w-4 text-amber-500" />;
  if (ev.includes('dlq') || ev.includes('dead'))
    return <Skull className="h-4 w-4 text-rose-500" />;
  return <ActivityIcon />;
};

const ActivityIcon = () => (
  <GitCommit className="h-4 w-4 text-muted-foreground" />
);

export default function ActivityTimelinePage() {
  const [search, setSearch] = React.useState('');
  const [eventType, setEventType] = React.useState('ALL');

  const {
    data: events,
    isLoading,
    refetch,
  } = useCombinedActivityEvents({
    search,
    eventType: eventType === 'ALL' ? undefined : eventType,
  });

  const eventTypeOptions = [
    { value: 'ALL', label: 'All Event Types' },
    ...[
      'job.submitted',
      'job.queued',
      'job.claimed',
      'job.running',
      'job.completed',
      'job.failed',
      'job.retry_pending',
      'job.retry_exhausted',
    ].map((ev) => ({ value: ev, label: ev })),
  ];

  return (
    <DashboardContainer>
      <PageHeader
        title="Activity Timeline"
        description="Chronological audit log tracking job enqueues, retry events, worker pools, and scheduler loops."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            aria-label="Refresh activity log"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search events"
            placeholder="Search by Job ID, Event message..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            aria-label="Event Type filter"
            placeholder="Filter event type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            options={eventTypeOptions}
          />
        </div>
      </div>

      <SectionCard title="Chronological Event Audit log">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading audit log entries...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No system audit log entries matching filters.
          </div>
        ) : (
          <div className="relative border-l border-border/80 ml-4 pl-6 space-y-6 py-2">
            {events.map((event, idx) => (
              <div
                key={`${event.id}-${idx}`}
                className="relative flex items-start gap-4"
              >
                {/* Timeline node */}
                <div className="absolute -left-9 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm">
                  {getEventIcon(event.event)}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="text-sm font-semibold text-foreground leading-none">
                      {event.message}
                    </p>
                    <RelativeTime date={event.timestamp} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] uppercase"
                    >
                      {event.event}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Timestamp: {new Date(event.timestamp).toLocaleString()}
                    </span>
                    {/* Navigation triggers */}
                    {event.event.startsWith('job.') && (
                      <Link
                        href={`/dashboard/jobs/${event.id}`}
                        className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 ml-2 font-medium"
                      >
                        Inspect Job
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </DashboardContainer>
  );
}
