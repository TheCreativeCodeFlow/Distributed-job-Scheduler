'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  History,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  queueName: string;
  workerHostname: string | null;
  status: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activity?: ActivityItem[];
  loading?: boolean;
}

export function ActivityFeed({ activity = [], loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card className="bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground">
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-full bg-muted animate-pulse rounded-md"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        );
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />;
      case 'RUNNING':
        return (
          <PlayCircle className="h-4 w-4 text-sky-500 flex-shrink-0 animate-spin" />
        );
      case 'RETRY_PENDING':
        return (
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        );
      default:
        return (
          <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'RUNNING':
        return <Badge variant="info">Running</Badge>;
      case 'RETRY_PENDING':
        return <Badge variant="warning">Retry Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-card/60 backdrop-blur-md">
      <CardHeader className="border-b border-border/40 pb-4 mb-4 bg-muted/5">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto scrollbar-thin space-y-3.5 pr-2 select-none">
        {activity.length === 0 ? (
          <div className="py-12 text-center text-xs font-semibold text-muted-foreground">
            No recent job activity recorded in this workspace.
          </div>
        ) : (
          activity.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-secondary/20 border border-border/40 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex gap-2.5">
                {getStatusIcon(item.status)}
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                    Job ID: {item.id}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
                    <span>Queue: {item.queueName}</span>
                    {item.workerHostname && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>Worker: {item.workerHostname}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {getStatusBadge(item.status)}
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
export default ActivityFeed;
