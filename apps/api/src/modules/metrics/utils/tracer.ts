import { logger } from '../../../logger/index.js';

export class Tracer {
  /**
   * Starts a tracing span using correlation ID.
   */
  public static startSpan(
    name: string,
    correlationId: string,
    parentSpanId?: string,
  ) {
    const spanId = Math.random().toString(36).substring(2, 10);
    logger.info(
      {
        traceId: correlationId,
        spanId,
        parentSpanId,
        spanName: name,
      },
      `[Span Start] ${name}`,
    );

    return {
      spanId,
      end: () => {
        logger.info(
          {
            traceId: correlationId,
            spanId,
            spanName: name,
          },
          `[Span End] ${name}`,
        );
      },
    };
  }
}
