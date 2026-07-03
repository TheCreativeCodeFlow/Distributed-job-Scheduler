import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Sparkline } from './sparkline';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: number; // e.g. 12.4 for +12.4%
  icon?: React.ReactNode;
  sparklineData?: number[];
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
  sparklineData,
  className,
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card className={cn('relative overflow-hidden hoverEffect', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
            {title}
          </span>
          {icon && <div className="text-muted-foreground/80">{icon}</div>}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            {value}
          </span>
          {trend !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold select-none',
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400',
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {isPositive ? '+' : ''}
              {trend}%
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          {description && (
            <p className="text-xs text-muted-foreground font-medium">
              {description}
            </p>
          )}
          {sparklineData && (
            <Sparkline
              data={sparklineData}
              color={isPositive ? 'stroke-emerald-400' : 'stroke-rose-400'}
              width={80}
              height={24}
              className="opacity-80"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
