export interface ActivityItem {
  id: string;
  queueName: string;
  workerHostname: string | null;
  status: string;
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  event: string;
  message: string;
  timestamp: string;
}

export interface ActivityFilterParams {
  search?: string;
  eventType?: string;
  queueId?: string;
  status?: string;
}
