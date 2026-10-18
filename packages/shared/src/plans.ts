import { PlanLimits, PlanType, EXPIRATION_SECONDS } from './types';

// Global Free-Tier Quota Constants & Defaults
export const FREE_TIER_LIMITS = {
  maxImageBytes: 5 * 1024 * 1024,   // 5 MB max per image upload for free tier
  maxTextBytes: 100 * 1024,         // 100 KB max per text share for free tier
  maxAnonymousSharesPerDay: 10,     // 10 shares / day per anonymous visitor
  maxAccountSharesPerDay: 100,      // 100 shares / day for Pro accounts
  rateLimitPerMinute: 20,           // 20 requests / minute max
  expirationSeconds: EXPIRATION_SECONDS, // Strictly 300 seconds (5 min)
  maxActiveStoredBytes: 500 * 1024 * 1024, // 500 MB global buffer
  maxDailyKvWrites: 800,            // Safe buffer under 1,000 KV writes/day free limit
};

export const PLANS: Record<PlanType, PlanLimits> = {
  free: {
    name: 'Free Starter',
    priceMonthlyInr: 0,
    priceMonthlyUsd: 0,
    maxTextBytes: 100 * 1024, // 100 KB
    maxImageBytes: 5 * 1024 * 1024, // 5 MB
    maxSharesPerDay: 10,
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
    name: 'Pro Individual',
    priceMonthlyInr: 299,
    priceMonthlyUsd: 4.99,
    maxTextBytes: 500 * 1024, // 500 KB
    maxImageBytes: 15 * 1024 * 1024, // 15 MB
    maxSharesPerDay: 100,
    expirationSeconds: EXPIRATION_SECONDS, // strictly 300 seconds (5 min)
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
  },
  pro: {
    name: 'Team / Business',
    priceMonthlyInr: 799,
    priceMonthlyUsd: 14.99,
    maxTextBytes: 1024 * 1024, // 1 MB
    maxImageBytes: 25 * 1024 * 1024, // 25 MB
    maxSharesPerDay: 500,
    expirationSeconds: EXPIRATION_SECONDS, // strictly 300 seconds (5 min)
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
