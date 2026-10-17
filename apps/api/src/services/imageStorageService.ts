import { Env } from '../types/env';

export interface ImageStorageObject {
  stream: ReadableStream;
  size: number;
  contentType: string;
}

export interface IImageStorageService {
  uploadImage(
    key: string,
    data: ReadableStream | ArrayBuffer | Uint8Array,
    contentType: string,
    size?: number
  ): Promise<void>;
  getImage(key: string): Promise<ImageStorageObject | null>;
  deleteImage(key: string): Promise<void>;
  isAvailable(): boolean;
  getMode(): string;
}

export class ImageStorageService implements IImageStorageService {
  private kv: KVNamespace;

  constructor(private env: Env) {
    this.kv = env.IMAGE_STORE;
  }

  isAvailable(): boolean {
    return Boolean(this.kv);
  }

  getMode(): string {
    return 'kv';
  }

  private ensureAvailable() {
    if (!this.isAvailable()) {
      const err = new Error(
        'Cloudflare Workers KV (IMAGE_STORE) binding is not configured. Text sharing remains operational.'
      );
      (err as any).status = 503;
      throw err;
    }
  }

  /**
   * Stores binary image bytes directly into Cloudflare Workers KV.
   * No base64 conversion is performed to preserve maximum storage efficiency.
   * Sets a secondary safety expirationTtl of 600 seconds (10 minutes).
   */
  async uploadImage(
    key: string,
    data: ReadableStream | ArrayBuffer | Uint8Array,
    contentType: string,
    size?: number
  ): Promise<void> {
    this.ensureAvailable();

    let buffer: ArrayBuffer;
    if (data instanceof ReadableStream) {
      const res = new Response(data);
      buffer = await res.arrayBuffer();
    } else if (data instanceof ArrayBuffer) {
      buffer = data;
    } else if (ArrayBuffer.isView(data)) {
      const copy = new Uint8Array(data.byteLength);
      copy.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
      buffer = copy.buffer as ArrayBuffer;
    } else {
      buffer = data as ArrayBuffer;
    }

    const byteSize = size || buffer.byteLength;

    await this.kv.put(key, buffer, {
      metadata: {
        contentType,
        size: byteSize,
      },
      // 600 seconds (10 min) TTL gives an automatic Cloudflare background cleanup
      // while D1 strictly enforces the exact 300-second boundary.
      expirationTtl: 600,
    });
  }

  /**
   * Retrieves raw image bytes and metadata from Workers KV.
   */
  async getImage(key: string): Promise<ImageStorageObject | null> {
    this.ensureAvailable();

    const { value, metadata } = await this.kv.getWithMetadata<{ contentType: string; size: number }>(key, {
      type: 'arrayBuffer',
    });

    if (!value) return null;

    const stream = new Response(value).body!;
    return {
      stream,
      size: metadata?.size || value.byteLength,
      contentType: metadata?.contentType || 'application/octet-stream',
    };
  }

  /**
   * Deletes raw image bytes from Workers KV immediately.
   */
  async deleteImage(key: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await this.kv.delete(key);
    } catch (err) {
      // Re-throw so caller (cleanup or deletion handler) can enqueue retry
      throw err;
    }
  }
}
