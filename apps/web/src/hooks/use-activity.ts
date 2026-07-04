import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';
import type {
  ActivityItem,
  TimelineEvent,
  ActivityFilterParams,
} from '../types/activity';

export const activityKeys = {
  all: ['activity'] as const,
  list: () => [...activityKeys.all, 'list'] as const,
  timeline: () => [...activityKeys.all, 'timeline'] as const,
};

export function useActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: activityKeys.list(),
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/activity');
      return res.data as ActivityItem[];
    },
  });
}

export function useTimelineEvents() {
  return useQuery<TimelineEvent[]>({
    queryKey: activityKeys.timeline(),
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/timeline');
      return res.data as TimelineEvent[];
    },
  });
}

export function useCombinedActivityEvents(params: ActivityFilterParams = {}) {
  const activityQuery = useActivity();
  const timelineQuery = useTimelineEvents();

  const isLoading = activityQuery.isLoading || timelineQuery.isLoading;
  const error = activityQuery.error || timelineQuery.error;

  const activityData = activityQuery.data ?? [];
  const timelineData = timelineQuery.data ?? [];

  // Convert ActivityItems into unified timeline event format
  const mappedActivities: TimelineEvent[] = activityData.map((act) => ({
    id: act.id,
    event: `job.${act.status.toLowerCase()}`,
    message:
      `Job ${act.id.slice(0, 8)} transitioned to status ${act.status} in queue '${act.queueName}'` +
      (act.workerHostname ? ` on worker ${act.workerHostname}` : ''),
    timestamp: act.timestamp,
  }));

  // Combine both sources
  let combined = [...timelineData, ...mappedActivities];

  // Deduplicate by event message and timestamp
  const seen = new Set<string>();
  combined = combined.filter((item) => {
    const key = `${item.event}-${item.message}-${item.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Client side filtering
  if (params.search) {
    const query = params.search.trim().toLowerCase();
    combined = combined.filter(
      (item) =>
        item.message.toLowerCase().includes(query) ||
        item.event.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query),
    );
  }

  if (params.eventType && params.eventType !== 'ALL') {
    combined = combined.filter((item) => item.event === params.eventType);
  }

  // Sort by timestamp descending
  combined.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return {
    data: combined,
    isLoading,
    error,
    refetch: () => {
      activityQuery.refetch();
      timelineQuery.refetch();
    },
  };
}
