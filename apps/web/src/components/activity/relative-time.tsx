'use client';

import React from 'react';

interface RelativeTimeProps {
  date: string;
}

const getRelativeTimeStr = (isoString: string) => {
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
};

export function RelativeTime({ date }: RelativeTimeProps) {
  const [relativeTime, setRelativeTime] = React.useState(
    getRelativeTimeStr(date),
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTime(getRelativeTimeStr(date));
    }, 15000); // refresh every 15s

    return () => clearInterval(timer);
  }, [date]);

  return (
    <span className="text-xs text-muted-foreground font-medium">
      {relativeTime}
    </span>
  );
}
