'use client';

import React from 'react';
import { useRelativeTime } from '../../lib/live/useRelativeTime';

interface RelativeTimeProps {
  date: string;
}

export function RelativeTime({ date }: RelativeTimeProps) {
  const relativeTime = useRelativeTime(date);

  return (
    <span className="text-xs text-muted-foreground font-medium">
      {relativeTime}
    </span>
  );
}
