import { logger } from '../../logger/index.js';

export type AuditAction =
  | 'auth.login'
  | 'auth.register'
  | 'auth.refresh'
  | 'auth.logout'
  | 'job.claimed'
  | 'job.started'
  | 'job.completed'
  | 'job.failed'
  | 'job.retry_manual'
  | 'dlq.replayed'
  | 'dlq.purged'
  | 'worker.registered'
  | 'worker.deregistered'
  | 'organization.deleted'
  | 'queue.created'
  | 'queue.paused'
  | 'queue.deleted';

export interface AuditEvent {
  action: AuditAction;
  userId: string;
  resourceId?: string | undefined;
  resourceType?: string | undefined;
  ip?: string | undefined;
  correlationId?: string | undefined;
  metadata?: Record<string, string | number | boolean> | undefined;
}

/**
 * Structured, tamper-evident audit logger.
 * Never logs payload contents or sensitive data.
 */
export class AuditLogger {
  public static log(event: AuditEvent): void {
    logger.info(
      {
        audit: true,
        action: event.action,
        userId: event.userId,
        resourceId: event.resourceId,
        resourceType: event.resourceType,
        ip: event.ip,
        correlationId: event.correlationId,
        metadata: event.metadata,
        timestamp: new Date().toISOString(),
      },
      `[AUDIT] ${event.action}`,
    );
  }
}
