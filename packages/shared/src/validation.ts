import { z } from 'zod';
import { ALLOWED_IMAGE_MIME_TYPES } from './plans';

export const textFormatSchema = z.enum([
  'plain_text',
  'markdown',
  'source_code',
  'json',
  'logs',
]);

export const syntaxLanguageSchema = z.enum([
  'plaintext',
  'javascript',
  'typescript',
  'python',
  'html',
  'css',
  'json',
  'sql',
  'bash',
  'powershell',
  'rust',
  'go',
  'yaml',
  'markdown',
]);

export const createTextShareSchema = z.object({
  title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional().or(z.literal('')),
  textContent: z.string().min(1, 'Content cannot be empty'),
  textFormat: textFormatSchema.default('plain_text'),
  syntaxLanguage: syntaxLanguageSchema.default('plaintext').optional(),
  password: z.string().min(4, 'Password must be at least 4 characters').max(64).optional().or(z.literal('')),
  burnAfterRead: z.boolean().default(false).optional(),
  allowDownload: z.boolean().default(true).optional(),
  customAlias: z.string().regex(/^[a-zA-Z0-9_-]{3,32}$/, 'Alias must be 3-32 alphanumeric characters').optional().or(z.literal('')),
});

export const initImageUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255),
  fileSize: z.number().int().positive('File size must be positive'),
  fileMimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
    errorMap: () => ({ message: 'Unsupported image format. Allowed: JPEG, PNG, WebP, GIF, AVIF' }),
  }),
  password: z.string().min(4, 'Password must be at least 4 characters').max(64).optional().or(z.literal('')),
  burnAfterRead: z.boolean().default(false).optional(),
  allowDownload: z.boolean().default(true).optional(),
  customAlias: z.string().regex(/^[a-zA-Z0-9_-]{3,32}$/, 'Alias must be 3-32 alphanumeric characters').optional().or(z.literal('')),
});

export const unlockShareSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const deleteShareSchema = z.object({
  deletionToken: z.string().optional(),
});

export const reportAbuseSchema = z.object({
  shareId: z.string().min(1, 'Share ID is required'),
  reason: z.enum(['copyright', 'malware', 'illegal', 'personal_data', 'spam', 'other']),
  details: z.string().max(1000).optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
