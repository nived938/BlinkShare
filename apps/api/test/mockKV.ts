/**
 * In-memory Mock KVNamespace conforming to Cloudflare Workers KV API for automated tests.
 */
export class MockKVNamespace {
  private store: Map<string, { value: ArrayBuffer; metadata?: any; expiration?: number }> = new Map();

  reset() {
    this.store.clear();
  }

  async put(
    key: string,
    value: string | ArrayBuffer | ReadableStream | ArrayBufferView,
    options?: { metadata?: any; expirationTtl?: number; expiration?: number }
  ): Promise<void> {
    let buffer: ArrayBuffer;
    if (typeof value === 'string') {
      buffer = new TextEncoder().encode(value).buffer;
    } else if (value instanceof ArrayBuffer) {
      buffer = value;
    } else if (ArrayBuffer.isView(value)) {
      buffer = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    } else if (value instanceof ReadableStream) {
      const res = new Response(value);
      buffer = await res.arrayBuffer();
    } else {
      buffer = new ArrayBuffer(0);
    }

    this.store.set(key, {
      value: buffer,
      metadata: options?.metadata,
      expiration: options?.expiration,
    });
  }

  async get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any> {
    const entry = this.store.get(key);
    if (!entry) return null;

    const type = options?.type || 'text';
    if (type === 'arrayBuffer') {
      return entry.value;
    }
    if (type === 'stream') {
      return new Response(entry.value).body;
    }
    if (type === 'json') {
      const text = new TextDecoder().decode(entry.value);
      return JSON.parse(text);
    }
    return new TextDecoder().decode(entry.value);
  }

  async getWithMetadata<Metadata = unknown>(
    key: string,
    options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }
  ): Promise<{ value: any; metadata: Metadata | null }> {
    const entry = this.store.get(key);
    if (!entry) {
      return { value: null, metadata: null };
    }

    const value = await this.get(key, options);
    return {
      value,
      metadata: (entry.metadata as Metadata) || null,
    };
  }

  public shouldFailDelete = false;

  async delete(key: string): Promise<void> {
    if (this.shouldFailDelete) {
      throw new Error('KV delete error: simulated network failure');
    }
    this.store.delete(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  getStoredKeys(): string[] {
    return Array.from(this.store.keys());
  }
}
