import { PlanType } from '@blinkshare/shared';

export interface Env {
  DB: D1Database;
  IMAGE_STORE: KVNamespace;
  APP_NAME?: string;
  APP_URL?: string;
  API_URL?: string;
  RATE_LIMIT_SECRET?: string;
  SESSION_SECRET?: string;
  // Maximum byte limits (configurable via env vars or defaults)
  MAX_IMAGE_BYTES?: string; // default 5242880 (5 MB)
  MAX_TEXT_BYTES?: string;  // default 102400 (100 KB)
  // Test clock override in seconds, used in automated testing
  TEST_CLOCK_OFFSET?: string;
}

export interface AuthContext {
  userId?: string;
  userEmail?: string;
  plan: PlanType;
}

export interface AppVariables {
  auth: AuthContext;
  clientIpHash: string;
}
