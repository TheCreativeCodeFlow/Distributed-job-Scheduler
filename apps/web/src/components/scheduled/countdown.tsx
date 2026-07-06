'use client';

import React from 'react';
import { useNow } from '../../lib/live/useNow';

interface CountdownProps {
  targetDate: string;
}

export function Countdown({ targetDate }: CountdownProps) {
  const now = useNow();

  const timeLeft = React.useMemo(() => {
    const difference = new Date(targetDate).getTime() - now.getTime();
    if (difference <= 0) {
      return 'Promoting now...';
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  }, [targetDate, now]);

  return (
    <span className="font-mono text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded select-none">
      {timeLeft}
    </span>
  );
}
