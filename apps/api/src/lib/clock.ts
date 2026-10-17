import { Env } from '../types/env';

/**
 * Returns current Unix timestamp in seconds.
 * Allows test clock offset for deterministic automated testing.
 */
export function getCurrentTimestamp(env?: Partial<Env>): number {
  const baseSeconds = Math.floor(Date.now() / 1000);
  if (env?.TEST_CLOCK_OFFSET) {
    const offset = parseInt(env.TEST_CLOCK_OFFSET, 10);
    if (!isNaN(offset)) {
      return baseSeconds + offset;
    }
  }
  return baseSeconds;
}
