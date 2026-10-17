import { PlanLimits, PlanType, EXPIRATION_SECONDS } from './types';

export const PLANS: Record<PlanType, PlanLimits> = {
  free: {
    name: 'Free',
    priceMonthlyInr: 0,
    priceMonthlyUsd: 0,
    maxTextBytes: 100 * 1024, // 100 KB
    maxImageBytes: 5 * 1024 * 1024, // 5 MB
    maxSharesPerDay: 10,
    expirationSeconds: EXPIRATION_SECONDS, // strictly 300 seconds (5 min)
    qrCode: true,
    codeHighlighting: true,
    passwordProtection: false,
    burnAfterFirstView: false,
    shareHistoryForAccounts: 'basic',
    downloadRestrictionOption: false,
    detailedShareAnalytics: 'none',
    batchImageSharing: false,
    customShareAlias: false,
    promotionalBanners: true,
  },
  plus: {
    name: 'Plus',
    priceMonthlyInr: 99,
    priceMonthlyUsd: 1.49,
    maxTextBytes: 500 * 1024, // 500 KB
    maxImageBytes: 25 * 1024 * 1024, // 25 MB
    maxSharesPerDay: 100,
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
    name: 'Pro',
    priceMonthlyInr: 249,
    priceMonthlyUsd: 3.49,
    maxTextBytes: 1024 * 1024, // 1 MB
    maxImageBytes: 50 * 1024 * 1024, // 50 MB
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
