import { PlanLimits, PlanType, EXPIRATION_SECONDS } from './types';

// Global Free-Tier Quota Constants (100% Free, Zero Billing)
export const FREE_TIER_LIMITS = {
  maxImageBytes: 5 * 1024 * 1024,   // Strict 5 MB max per image upload (KV Free tier safe)
  maxTextBytes: 100 * 1024,         // Strict 100 KB max per text share (D1 Free tier safe)
  maxAnonymousSharesPerDay: 10,     // 10 shares / day per anonymous visitor
  maxAccountSharesPerDay: 100,      // 100 shares / day for free registered accounts
  rateLimitPerMinute: 20,           // 20 requests / minute max
  expirationSeconds: EXPIRATION_SECONDS, // Strictly 300 seconds (5 min)
  maxActiveStoredBytes: 500 * 1024 * 1024, // 500 MB global buffer (safe under 1 GB KV free)
  maxDailyKvWrites: 800,            // Safe buffer under 1,000 KV writes/day free limit
};

export const PLANS: Record<PlanType, PlanLimits> = {
  free: {
    name: 'Free (Anonymous)',
    priceMonthlyInr: 0,
    priceMonthlyUsd: 0,
    maxTextBytes: FREE_TIER_LIMITS.maxTextBytes,
    maxImageBytes: FREE_TIER_LIMITS.maxImageBytes,
    maxSharesPerDay: FREE_TIER_LIMITS.maxAnonymousSharesPerDay,
    expirationSeconds: EXPIRATION_SECONDS, // strictly 300 seconds (5 min)
    qrCode: true,
    codeHighlighting: true,
    passwordProtection: true,
    burnAfterFirstView: true,
    shareHistoryForAccounts: 'none',
    downloadRestrictionOption: true,
    detailedShareAnalytics: 'none',
    batchImageSharing: false,
    customShareAlias: true,
    promotionalBanners: false,
  },
  plus: {
    name: 'Free Account',
    priceMonthlyInr: 0,
    priceMonthlyUsd: 0,
    maxTextBytes: FREE_TIER_LIMITS.maxTextBytes,
    maxImageBytes: FREE_TIER_LIMITS.maxImageBytes,
    maxSharesPerDay: FREE_TIER_LIMITS.maxAccountSharesPerDay,
    expirationSeconds: EXPIRATION_SECONDS, // strictly 300 seconds (5 min)
    qrCode: true,
    codeHighlighting: true,
    passwordProtection: true,
    burnAfterFirstView: true,
    shareHistoryForAccounts: 'basic',
    downloadRestrictionOption: true,
    detailedShareAnalytics: 'basic',
    batchImageSharing: false,
    customShareAlias: true,
    promotionalBanners: false,
  },
  pro: {
    name: 'Free Community',
    priceMonthlyInr: 0,
    priceMonthlyUsd: 0,
    maxTextBytes: FREE_TIER_LIMITS.maxTextBytes,
    maxImageBytes: FREE_TIER_LIMITS.maxImageBytes,
    maxSharesPerDay: FREE_TIER_LIMITS.maxAccountSharesPerDay,
    expirationSeconds: EXPIRATION_SECONDS, // strictly 300 seconds (5 min)
    qrCode: true,
    codeHighlighting: true,
    passwordProtection: true,
    burnAfterFirstView: true,
    shareHistoryForAccounts: 'advanced',
    downloadRestrictionOption: true,
    detailedShareAnalytics: 'advanced',
    batchImageSharing: false,
    customShareAlias: true,
    promotionalBanners: false,
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
