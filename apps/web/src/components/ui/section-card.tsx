import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';
import { cn } from '../../lib/utils';

export interface SectionCardProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/40 pb-4 mb-4 bg-muted/5">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold text-foreground">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        {actions && (
          <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-0">{children}</CardContent>
    </Card>
  );
}
export default SectionCard;
