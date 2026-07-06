# Event Dispatcher

The internal messaging hub for the application.

## SSE_EVENTS Constants

All valid real-time events are defined in `SSE_EVENTS` within `EventDispatcher.ts`. Use these constants instead of strings.

### Example List of Events

- `JOB_CREATED`: 'JobCreated'
- `JOB_COMPLETED`: 'JobCompleted'
- `WORKER_LOST`: 'WorkerLost'
- `DEAD_LETTER_CREATED`: 'DeadLetterCreated'
- `QUEUE_PAUSED`: 'QueuePaused'

## In-Process Subscriptions

Components or managers subscribe to specific events:

```ts
import { globalEventDispatcher, SSE_EVENTS } from './EventDispatcher';

const unsubscribe = globalEventDispatcher.subscribe(
  SSE_EVENTS.JOB_COMPLETED,
  (payload) => {
    console.log('Job completed:', payload.jobId);
  },
);

// To clean up later:
unsubscribe();
```
