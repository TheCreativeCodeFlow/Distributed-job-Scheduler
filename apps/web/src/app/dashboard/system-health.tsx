'use client';

import React from 'react';
import {
  Shield,
  ShieldAlert,
  CheckCircle,
  Database as DbIcon,
  Zap,
  Cpu,
  Server,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface HealthData {
  databaseStatus: 'HEALTHY' | 'UNHEALTHY';
  redisStatus: 'HEALTHY' | 'UNHEALTHY';
  schedulerStatus: 'HEALTHY' | 'UNHEALTHY';
  workerAvailability: 'AVAILABLE' | 'DEGRADED';
  latencyMs: number;
}

interface SystemHealthProps {
  health?: HealthData;
  loading?: boolean;
}

export function SystemHealth({ health, loading }: SystemHealthProps) {
  if (loading) {
    return (
      <Card className="bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground">
            System Cluster Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-6 w-full bg-muted animate-pulse rounded-md"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
      case 'AVAILABLE':
        return (
          <Badge variant="success" className="gap-1 flex items-center">
            <CheckCircle className="h-3 w-3" />
            Healthy
          </Badge>
        );
      case 'DEGRADED':
        return (
          <Badge variant="warning" className="gap-1 flex items-center">
            <ShieldAlert className="h-3 w-3" />
            Degraded
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="gap-1 flex items-center">
            <ShieldAlert className="h-3 w-3" />
            Unhealthy
          </Badge>
        );
    }
  };

  const isHealthy =
    health?.databaseStatus === 'HEALTHY' &&
    health?.redisStatus === 'HEALTHY' &&
    health?.schedulerStatus === 'HEALTHY' &&
    health?.workerAvailability === 'AVAILABLE';

  return (
    <Card className="bg-card/60 backdrop-blur-md relative overflow-hidden">
      <div
        className={`absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(circle_at_top_right,${
          isHealthy ? 'var(--success)' : 'var(--destructive)'
        },transparent)]`}
      />
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 mb-4 bg-muted/5">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            {isHealthy ? (
              <Shield className="h-5 w-5 text-emerald-500 animate-pulse" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-rose-500 animate-bounce" />
            )}
            System Cluster Health
          </CardTitle>
        </div>
        <Badge
          variant={isHealthy ? 'success' : 'destructive'}
          className="font-extrabold tracking-wider"
        >
          {isHealthy ? 'ALL SYSTEMS OPERATIONAL' : 'SYSTEM DEGRADED'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* PostgreSQL */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/35 border border-border/40">
            <div className="flex items-center gap-2.5">
              <DbIcon className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-semibold text-muted-foreground">
                PostgreSQL
              </span>
            </div>
            {getStatusBadge(health?.databaseStatus || 'UNHEALTHY')}
          </div>

          {/* Redis */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/35 border border-border/40">
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-muted-foreground">
                Redis Cache
              </span>
            </div>
            {getStatusBadge(health?.redisStatus || 'UNHEALTHY')}
          </div>

          {/* Scheduler */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/35 border border-border/40">
            <div className="flex items-center gap-2.5">
              <Cpu className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-semibold text-muted-foreground">
                Scheduler Loop
              </span>
            </div>
            {getStatusBadge(health?.schedulerStatus || 'UNHEALTHY')}
          </div>

          {/* Workers */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/35 border border-border/40">
            <div className="flex items-center gap-2.5">
              <Server className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-muted-foreground">
                Workers Pools
              </span>
            </div>
            {getStatusBadge(health?.workerAvailability || 'DEGRADED')}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-2 border-t border-border/40">
          <span>Cluster Latency</span>
          <span className="text-foreground">{health?.latencyMs ?? 0} ms</span>
        </div>
      </CardContent>
    </Card>
  );
}
export default SystemHealth;
