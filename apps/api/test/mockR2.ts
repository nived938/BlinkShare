/**
 * In-memory Mock R2 Bucket conforming to Cloudflare R2Bucket API.
 */
export class MockR2Bucket {
  private store = new Map<string, { data: Uint8Array; httpMetadata?: any }>();
  public shouldFailDelete = false;

  async get(key: string): Promise<any> {
    const item = this.store.get(key);
    if (!item) return null;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(item.data);
        controller.close();
      },
    });

    return {
      key,
      version: 'v1',
      size: item.data.length,
      etag: 'etag-123',
      httpEtag: '"etag-123"',
      uploaded: new Date(),
      httpMetadata: item.httpMetadata || {},
      customMetadata: {},
      body: stream,
      bodyUsed: false,
      arrayBuffer: async () => item.data.buffer as ArrayBuffer,
      text: async () => new TextDecoder().decode(item.data),
      json: async () => JSON.parse(new TextDecoder().decode(item.data)),
      blob: async () => new Blob([item.data]),
      writeHttpMetadata: () => {},
    };
  }

  async head(key: string): Promise<any> {
    const item = this.store.get(key);
    if (!item) return null;
    return {
      key,
      version: 'v1',
      size: item.data.length,
      etag: 'etag-123',
      httpEtag: '"etag-123"',
      uploaded: new Date(),
      httpMetadata: item.httpMetadata || {},
      customMetadata: {},
      writeHttpMetadata: () => {},
    };
  }

  async put(
    key: string,
    value: any,
    options?: any
  ): Promise<any> {
    let uint8: Uint8Array;
    if (typeof value === 'string') {
      uint8 = new TextEncoder().encode(value);
    } else if (value instanceof Uint8Array) {
      uint8 = value;
    } else if (value instanceof ArrayBuffer) {
      uint8 = new Uint8Array(value);
    } else if (value && 'getReader' in value) {
      const reader = (value as ReadableStream).getReader();
      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const res = await reader.read();
        if (res.done) {
          done = true;
        } else if (res.value) {
          chunks.push(res.value);
        }
      }
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      uint8 = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        uint8.set(chunk, offset);
        offset += chunk.length;
      }
    } else {
      uint8 = new Uint8Array(0);
    }

    this.store.set(key, { data: uint8, httpMetadata: options?.httpMetadata });

    return {
      key,
      version: 'v1',
      size: uint8.length,
      etag: 'etag-123',
      httpEtag: '"etag-123"',
      uploaded: new Date(),
      httpMetadata: options?.httpMetadata || {},
      customMetadata: {},
      writeHttpMetadata: () => {},
    };
  }

  async delete(keys: string | string[]): Promise<void> {
    if (this.shouldFailDelete) {
      throw new Error('Simulated R2 storage failure');
    }
    const keyArray = Array.isArray(keys) ? keys : [keys];
    for (const k of keyArray) {
      this.store.delete(k);
    }
  }

  async list(options?: any): Promise<any> {
    const objects: any[] = [];
    for (const [key, val] of this.store.entries()) {
      objects.push({
        key,
        version: 'v1',
        size: val.data.length,
        etag: 'etag-123',
        httpEtag: '"etag-123"',
        uploaded: new Date(),
        httpMetadata: val.httpMetadata || {},
        customMetadata: {},
        writeHttpMetadata: () => {},
      });
    }
    return {
      objects,
      truncated: false,
      delimitedPrefixes: [],
    };
  }
}
