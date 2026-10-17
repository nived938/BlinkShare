import { Env } from '../types/env';

export interface ImageStorageObject {
  stream: ReadableStream;
  size: number;
  contentType: string;
}

export interface IImageStorageService {
  uploadImage(key: string, data: ReadableStream | ArrayBuffer | Uint8Array, contentType: string): Promise<void>;
  getImage(key: string): Promise<ImageStorageObject | null>;
  deleteImage(key: string): Promise<void>;
  getImageMetadata(key: string): Promise<{ size: number; contentType: string } | null>;
  hasImage(key: string): Promise<boolean>;
  isAvailable(): boolean;
  getMode(): 'local' | 'r2' | 'disabled';
}

export class ImageStorageService implements IImageStorageService {
  private mode: 'local' | 'r2' | 'disabled';
  private bucket?: R2Bucket;

  constructor(private env: Env) {
    this.bucket = env.IMAGES;
    const configuredMode = env.IMAGE_STORAGE_MODE?.toLowerCase();

    if (configuredMode === 'disabled') {
      this.mode = 'disabled';
    } else if (configuredMode === 'r2') {
      this.mode = this.bucket ? 'r2' : 'disabled';
    } else {
      // Default to 'local' simulation when in local development or fallback
      this.mode = this.bucket ? 'local' : 'disabled';
    }
  }

  isAvailable(): boolean {
    return this.mode !== 'disabled' && Boolean(this.bucket);
  }

  getMode(): 'local' | 'r2' | 'disabled' {
    return this.mode;
  }

  private ensureAvailable() {
    if (!this.isAvailable()) {
      const err = new Error(
        'Image storage is currently not configured or disabled. Text sharing remains fully operational. To enable image sharing, configure Cloudflare R2 or run Wrangler with local R2 simulation.'
      );
      (err as any).status = 503;
      throw err;
    }
  }

  async uploadImage(
    key: string,
    data: ReadableStream | ArrayBuffer | Uint8Array,
    contentType: string
  ): Promise<void> {
    this.ensureAvailable();
    await this.bucket!.put(key, data, {
      httpMetadata: {
        contentType,
      },
    });
  }

  async getImage(key: string): Promise<ImageStorageObject | null> {
    this.ensureAvailable();
    const obj = await this.bucket!.get(key);
    if (!obj) return null;

    return {
      stream: obj.body,
      size: obj.size,
      contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
    };
  }

  async deleteImage(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }
    await this.bucket!.delete(key);
  }

  async getImageMetadata(key: string): Promise<{ size: number; contentType: string } | null> {
    this.ensureAvailable();
    const obj = await this.bucket!.head(key);
    if (!obj) return null;

    return {
      size: obj.size,
      contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
    };
  }

  async hasImage(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    const obj = await this.bucket!.head(key);
    return Boolean(obj);
  }
}
