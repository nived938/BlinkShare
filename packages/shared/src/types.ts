export const EXPIRATION_SECONDS = 300; // Strictly 5 minutes (300 seconds)

export type ShareContentType = 'text' | 'image';

export type TextFormat = 'plain_text' | 'markdown' | 'source_code' | 'json' | 'logs';

export type SyntaxLanguage =
  | 'plaintext'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'html'
  | 'css'
  | 'json'
  | 'sql'
  | 'bash'
  | 'powershell'
  | 'rust'
  | 'go'
  | 'yaml'
  | 'markdown';

export type PlanType = 'free' | 'plus' | 'pro';

export interface PlanLimits {
  name: string;
  priceMonthlyInr: number;
  priceMonthlyUsd: number;
  maxTextBytes: number;
  maxImageBytes: number;
  maxSharesPerDay: number;
  expirationSeconds: number; // Always 300
  qrCode: boolean;
  codeHighlighting: boolean;
  passwordProtection: boolean;
  burnAfterFirstView: boolean;
  shareHistoryForAccounts: 'none' | 'basic' | 'advanced';
  downloadRestrictionOption: boolean;
  detailedShareAnalytics: 'none' | 'basic' | 'advanced';
  batchImageSharing: boolean;
  customShareAlias: boolean;
  promotionalBanners: boolean;
}

export interface ShareMetadata {
  id: string;
  contentType: ShareContentType;
  createdAt: number; // Unix timestamp in seconds
  expiresAt: number; // Unix timestamp in seconds (strictly createdAt + 300)
  title?: string | null;
  textFormat?: TextFormat | null;
  syntaxLanguage?: SyntaxLanguage | null;
  originalFilename?: string | null;
  fileMimeType?: string | null;
  fileSize?: number | null;
  hasPassword?: boolean;
  burnAfterRead?: boolean;
  allowDownload?: boolean;
  viewCount?: number;
  isExpired: boolean;
  secondsRemaining: number;
}

export interface ShareContentResponse {
  metadata: ShareMetadata;
  textContent?: string;
  isPasswordRequired?: boolean;
  isBurned?: boolean;
}

export interface CreateTextSharePayload {
  title?: string;
  textContent: string;
  textFormat?: TextFormat;
  syntaxLanguage?: SyntaxLanguage;
  password?: string;
  burnAfterRead?: boolean;
  allowDownload?: boolean;
  customAlias?: string;
}

export interface CreateShareResult {
  id: string;
  shareUrl: string;
  deletionToken: string; // Secret anonymous deletion token
  createdAt: number;
  expiresAt: number;
  contentType: ShareContentType;
}

export interface InitImageUploadPayload {
  filename: string;
  fileSize: number;
  fileMimeType: string;
  password?: string;
  burnAfterRead?: boolean;
  allowDownload?: boolean;
  customAlias?: string;
}

export interface InitImageUploadResult {
  uploadToken: string;
  uploadUrl: string;
  maxBytes: number;
  expiresInSeconds: number;
}

export interface FinalizeImageUploadResult extends CreateShareResult {
  fileSize: number;
  fileMimeType: string;
}

export interface UnlockSharePayload {
  password: string;
}

export interface DeleteSharePayload {
  deletionToken?: string;
}

export interface ReportAbusePayload {
  shareId: string;
  reason: 'copyright' | 'malware' | 'illegal' | 'personal_data' | 'spam' | 'other';
  details?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  plan: PlanType;
  createdAt: number;
  sharesCreatedToday: number;
  dailyQuotaRemaining: number;
}

export interface UserShareItem {
  id: string;
  contentType: ShareContentType;
  title?: string | null;
  originalFilename?: string | null;
  createdAt: number;
  expiresAt: number;
  secondsRemaining: number;
  isExpired: boolean;
  viewCount: number;
  burnAfterRead: boolean;
}
