import {
  PlanLimits,
  PlanType,
  EXPIRATION_SECONDS,
  MIN_EXPIRATION_SECONDS,
  MAX_EXPIRATION_SECONDS,
} from './types';

// Global Free-Tier Quota Constants (100% Free, Zero Billing)
export const FREE_TIER_LIMITS = {
  maxImageBytes: 5 * 1024 * 1024,   // 5 MB max per image upload
  maxTextBytes: 100 * 1024,         // 100 KB max per text share
  maxAnonymousSharesPerDay: 10,     // 10 shares / day per visitor (anonymous)
  maxAccountSharesPerDay: 100,      // 100 shares / day for free registered accounts
  rateLimitPerMinute: 20,           // 20 requests / minute max
  minExpirationSeconds: MIN_EXPIRATION_SECONDS, // 60 seconds (1 minute)
  maxExpirationSeconds: MAX_EXPIRATION_SECONDS, // 300 seconds (5 minutes)
  expirationSeconds: EXPIRATION_SECONDS,        // Default 300 seconds (5 minutes)
  maxActiveStoredBytes: 500 * 1024 * 1024,      // 500 MB global buffer
  maxDailyKvWrites: 800,                        // Safe buffer under 1,000 KV writes/day free limit
};

// 100% Free for Everyone - All Features Unlocked
export const PLANS: Record<PlanType, PlanLimits> = {
  free: {
    name: '100% Free Anonymous',
    priceMonthlyInr: 0,
    priceMonthlyUsd: 0,
    maxTextBytes: FREE_TIER_LIMITS.maxTextBytes,
    maxImageBytes: FREE_TIER_LIMITS.maxImageBytes,
    maxSharesPerDay: FREE_TIER_LIMITS.maxAnonymousSharesPerDay,
    minExpirationSeconds: MIN_EXPIRATION_SECONDS, // 1 min (60s)
    maxExpirationSeconds: MAX_EXPIRATION_SECONDS, // 5 min (300s)
    expirationSeconds: EXPIRATION_SECONDS,        // Default 5 min (300s)
    qrCode: true,
    codeHighlighting: true,
    passwordProtection: true,
    burnAfterFirstView: true,
    shareHistoryForAccounts: 'none',
    downloadRestrictionOption: true,
    detailedShareAnalytics: 'none',
    batchImageSharing: true,
    customShareAlias: true,
    promotionalBanners: false,
    clientSideEncryption: true,
    rawViewEndpoint: true,
  },
  plus: {
    name: '100% Free Registered',
    priceMonthlyInr: 0,
    priceMonthlyUsd: 0,
    maxTextBytes: 500 * 1024, // 500 KB
    maxImageBytes: 15 * 1024 * 1024, // 15 MB
    maxSharesPerDay: FREE_TIER_LIMITS.maxAccountSharesPerDay,
    minExpirationSeconds: MIN_EXPIRATION_SECONDS, // 1 min (60s)
    maxExpirationSeconds: MAX_EXPIRATION_SECONDS, // 5 min (300s)
    expirationSeconds: EXPIRATION_SECONDS,        // Default 5 min (300s)
    qrCode: true,
    codeHighlighting: true,
    passwordProtection: true,
    burnAfterFirstView: true,
    shareHistoryForAccounts: 'basic',
    downloadRestrictionOption: true,
    detailedShareAnalytics: 'basic',
    batchImageSharing: true,
    customShareAlias: true,
    promotionalBanners: false,
    clientSideEncryption: true,
    rawViewEndpoint: true,
  },
  pro: {
    name: '100% Free Power User',
    priceMonthlyInr: 0,
    priceMonthlyUsd: 0,
    maxTextBytes: 1024 * 1024, // 1 MB
    maxImageBytes: 25 * 1024 * 1024, // 25 MB
    maxSharesPerDay: 1000,
    minExpirationSeconds: MIN_EXPIRATION_SECONDS, // 1 min (60s)
    maxExpirationSeconds: MAX_EXPIRATION_SECONDS, // 5 min (300s)
    expirationSeconds: EXPIRATION_SECONDS,        // Default 5 min (300s)
    qrCode: true,
    codeHighlighting: true,
    passwordProtection: true,
    burnAfterFirstView: true,
    shareHistoryForAccounts: 'advanced',
    downloadRestrictionOption: true,
    detailedShareAnalytics: 'advanced',
    batchImageSharing: true,
    customShareAlias: true,
    promotionalBanners: false,
    clientSideEncryption: true,
    rawViewEndpoint: true,
  },
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export function isAllowedImageMimeType(mime: string): mime is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}
