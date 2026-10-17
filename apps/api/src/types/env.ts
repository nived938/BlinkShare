import { PlanType } from '@blinkshare/shared';

export interface Env {
  DB: D1Database;
  IMAGES?: R2Bucket;
  IMAGE_STORAGE_MODE?: 'local' | 'r2' | 'disabled';
  APP_NAME?: string;
  APP_URL?: string;
  API_URL?: string;
  RATE_LIMIT_SECRET?: string;
  SESSION_SECRET?: string;
  BILLING_PROVIDER?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
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
