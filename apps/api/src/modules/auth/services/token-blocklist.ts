import { RedisService } from '../../../redis/index.js';
import { logger } from '../../../logger/index.js';

const BLOCKLIST_PREFIX = 'token:blocklist:';

export class TokenBlocklist {
  /**
   * Adds a refresh token JTI to the blocklist with a TTL.
   */
  public static async add(jti: string, ttlSeconds: number): Promise<void> {
    try {
      const client = RedisService.getInstance();
      await client.set(`${BLOCKLIST_PREFIX}${jti}`, '1', 'EX', ttlSeconds);
    } catch (error) {
      logger.error({ error, jti }, 'Failed to add token to blocklist.');
    }
  }

  /**
   * Returns true if the JTI has been blocklisted (token was already rotated/revoked).
   */
  public static async isBlocked(jti: string): Promise<boolean> {
    try {
      const client = RedisService.getInstance();
      const result = await client.get(`${BLOCKLIST_PREFIX}${jti}`);
      return result !== null;
    } catch (error) {
      logger.error(
        { error, jti },
        'Failed to check token blocklist — failing open.',
      );
      // Fail open to avoid locking users out during Redis outage
      return false;
    }
  }
}
