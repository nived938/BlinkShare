/**
 * In-memory Mock D1 Database conforming to Cloudflare D1Database API for automated tests.
 */
export class MockD1Database {
  private tables: Map<string, any[]> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    this.tables.set('shares', []);
    this.tables.set('upload_sessions', []);
    this.tables.set('rate_limit_counters', []);
    this.tables.set('users', []);
    this.tables.set('subscriptions', []);
    this.tables.set('share_reports', []);
    this.tables.set('cleanup_retries', []);
  }

  prepare(query: string): D1PreparedStatement {
    return new MockD1PreparedStatement(this.tables, query) as unknown as D1PreparedStatement;
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    for (const stmt of statements) {
      results.push(await (stmt as unknown as MockD1PreparedStatement).run<T>());
    }
    return results;
  }

  async exec(query: string): Promise<D1ExecResult> {
    return { count: 0, duration: 0 };
  }

  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }
}

class MockD1PreparedStatement {
  private boundValues: any[] = [];

  constructor(private tables: Map<string, any[]>, private query: string) {}

  bind(...values: any[]): MockD1PreparedStatement {
    this.boundValues = values;
    return this;
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const all = await this.all<T>();
    if (all.results && all.results.length > 0) {
      return all.results[0];
    }
    return null;
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    return this.execute<T>();
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    return this.execute<T>();
  }

  async raw<T = unknown>(): Promise<T[]> {
    const res = await this.execute<any>();
    return (res.results || []) as T[];
  }

  private execute<T = unknown>(): D1Result<T> {
    const q = this.query.trim();
    const dummyMeta: any = {
      duration: 1,
      size_after: 1,
      rows_read: 1,
      rows_written: 1,
      last_row_id: 1,
      changed_db: true,
      changes: 1,
    };

    if (q.startsWith('CREATE TABLE') || q.startsWith('CREATE INDEX')) {
      return { success: true, results: [], meta: dummyMeta } as any;
    }

    if (q.includes('SELECT 1 FROM rate_limit_counters')) {
      return { success: true, results: [{ '1': 1 } as T], meta: dummyMeta } as any;
    }

    if (q.includes('coalesce(sum(file_size), 0) as activeBytes')) {
      const shares = this.tables.get('shares')!;
      const cutoff = this.boundValues[0] ?? 0;
      const active = shares.filter((s) => s.is_deleted === 0 && s.is_burned === 0 && s.expires_at > cutoff);
      const activeBytes = active.reduce((acc, s) => acc + (s.file_size || 0), 0);
      return { success: true, results: [{ activeCount: active.length, activeBytes } as T], meta: dummyMeta } as any;
    }

    // INSERT INTO shares
    if (q.includes('INSERT INTO shares')) {
      const shares = this.tables.get('shares')!;
      const [
        id, content_type, created_at, expires_at, title,
        text_content, text_format, syntax_language, original_filename,
        storage_key, file_mime_type, file_size, password_hash,
        burn_after_read, owner_id, deletion_token_hash, allow_download
      ] = this.boundValues;

      shares.push({
        id, content_type, created_at, expires_at, title,
        text_content, text_format, syntax_language, original_filename,
        storage_key, r2_object_key: storage_key, file_mime_type, file_size, password_hash,
        burn_after_read, owner_id, deletion_token_hash, view_count: 0,
        is_burned: 0, is_deleted: 0, allow_download
      });
      return { success: true, meta: { ...dummyMeta, changes: 1 } } as any;
    }

    // SELECT * FROM shares WHERE id = ?
    if (q.includes('SELECT * FROM shares WHERE id = ?')) {
      const shares = this.tables.get('shares')!;
      const id = this.boundValues[0];
      const found = shares.find((s) => s.id === id);
      return { success: true, results: found ? [found as T] : [], meta: dummyMeta } as any;
    }

    // UPDATE shares SET view_count
    if (q.includes('UPDATE shares SET view_count = view_count + 1')) {
      const shares = this.tables.get('shares')!;
      const id = this.boundValues[0];
      const item = shares.find((s) => s.id === id);
      if (item) item.view_count++;
      return { success: true, meta: { ...dummyMeta, changes: item ? 1 : 0 } } as any;
    }

    // UPDATE shares SET is_burned = 1, is_deleted = 1 WHERE id = ? AND is_burned = 0 AND is_deleted = 0
    if (q.includes('is_burned = 1, is_deleted = 1')) {
      const shares = this.tables.get('shares')!;
      const id = this.boundValues[0];
      const item = shares.find((s) => s.id === id && s.is_burned === 0 && s.is_deleted === 0);
      if (item) {
        item.is_burned = 1;
        item.is_deleted = 1;
        return { success: true, meta: { ...dummyMeta, changes: 1 } } as any;
      }
      return { success: true, meta: { ...dummyMeta, changes: 0 } } as any;
    }

    // DELETE FROM shares WHERE id = ? AND deletion_token_hash = ?
    if (q.includes('WHERE id = ? AND deletion_token_hash = ?')) {
      const shares = this.tables.get('shares')!;
      const [id, tokenHash] = this.boundValues;
      const idx = shares.findIndex((s) => s.id === id && s.deletion_token_hash === tokenHash);
      if (idx !== -1) {
        shares.splice(idx, 1);
        return { success: true, meta: { ...dummyMeta, changes: 1 } } as any;
      }
      return { success: true, meta: { ...dummyMeta, changes: 0 } } as any;
    }

    // DELETE FROM shares WHERE id = ? AND owner_id = ?
    if (q.includes('WHERE id = ? AND owner_id = ?')) {
      const shares = this.tables.get('shares')!;
      const [id, ownerId] = this.boundValues;
      const idx = shares.findIndex((s) => s.id === id && s.owner_id === ownerId);
      if (idx !== -1) {
        shares.splice(idx, 1);
        return { success: true, meta: { ...dummyMeta, changes: 1 } } as any;
      }
      return { success: true, meta: { ...dummyMeta, changes: 0 } } as any;
    }

    // DELETE FROM shares WHERE id = ?
    if (q.includes('DELETE FROM shares WHERE id = ?')) {
      const shares = this.tables.get('shares')!;
      const id = this.boundValues[0];
      const idx = shares.findIndex((s) => s.id === id);
      if (idx !== -1) {
        shares.splice(idx, 1);
        return { success: true, meta: { ...dummyMeta, changes: 1 } } as any;
      }
      return { success: true, meta: { ...dummyMeta, changes: 0 } } as any;
    }

    // SELECT * FROM shares WHERE expires_at <= ? OR is_burned = 1 OR is_deleted = 1
    if (q.includes('expires_at <= ? OR is_burned = 1 OR is_deleted = 1')) {
      const shares = this.tables.get('shares')!;
      const now = this.boundValues[0];
      const limit = this.boundValues[1] || 50;
      const matched = shares.filter((s) => s.expires_at <= now || s.is_burned === 1 || s.is_deleted === 1).slice(0, limit);
      return { success: true, results: matched as T[], meta: dummyMeta } as any;
    }

    // SELECT * FROM shares WHERE owner_id = ? AND expires_at > ?
    if (q.includes('owner_id = ? AND expires_at > ?')) {
      const shares = this.tables.get('shares')!;
      const [ownerId, now] = this.boundValues;
      const matched = shares.filter(
        (s) => s.owner_id === ownerId && s.expires_at > now && s.is_deleted === 0 && s.is_burned === 0
      );
      return { success: true, results: matched as T[], meta: dummyMeta } as any;
    }

    // Upload sessions
    if (q.includes('INSERT INTO upload_sessions')) {
      const sessions = this.tables.get('upload_sessions')!;
      const [
        token, filename, file_size, file_mime_type, r2_key,
        password_hash, burn_after_read, allow_download, custom_alias,
        owner_id, created_at, expires_at
      ] = this.boundValues;
      sessions.push({
        token, filename, file_size, file_mime_type, r2_key,
        password_hash, burn_after_read, allow_download, custom_alias,
        owner_id, created_at, expires_at, is_finalized: 0
      });
      return { success: true, meta: { ...dummyMeta, changes: 1 } } as any;
    }

    if (q.includes('SELECT * FROM upload_sessions WHERE token = ?')) {
      const sessions = this.tables.get('upload_sessions')!;
      const token = this.boundValues[0];
      const found = sessions.find((s) => s.token === token);
      return { success: true, results: found ? [found as T] : [], meta: dummyMeta } as any;
    }

    if (q.includes('UPDATE upload_sessions SET is_finalized = 1')) {
      const sessions = this.tables.get('upload_sessions')!;
      const token = this.boundValues[0];
      const found = sessions.find((s) => s.token === token);
      if (found) found.is_finalized = 1;
      return { success: true, meta: { ...dummyMeta, changes: found ? 1 : 0 } } as any;
    }

    if (q.includes('DELETE FROM upload_sessions WHERE token = ?')) {
      const sessions = this.tables.get('upload_sessions')!;
      const token = this.boundValues[0];
      const idx = sessions.findIndex((s) => s.token === token);
      if (idx !== -1) sessions.splice(idx, 1);
      return { success: true, meta: { ...dummyMeta, changes: 1 } } as any;
    }

    if (q.includes('SELECT * FROM upload_sessions WHERE expires_at <= ?')) {
      const sessions = this.tables.get('upload_sessions')!;
      const now = this.boundValues[0];
      const limit = this.boundValues[1] || 50;
      const matched = sessions.filter((s) => s.expires_at <= now || s.is_finalized === 1).slice(0, limit);
      return { success: true, results: matched as T[], meta: dummyMeta } as any;
    }

    // Rate limit counters
    if (q.includes('INSERT INTO rate_limit_counters')) {
      const counters = this.tables.get('rate_limit_counters')!;
      const [key_hash, window_type, window_start] = this.boundValues;
      let existing = counters.find(
        (c) => c.key_hash === key_hash && c.window_type === window_type && c.window_start === window_start
      );
      if (existing) {
        existing.count++;
      } else {
        existing = { key_hash, window_type, window_start, count: 1 };
        counters.push(existing);
      }
      return { success: true, results: [{ count: existing.count } as T], meta: dummyMeta } as any;
    }

    if (q.includes('SELECT count FROM rate_limit_counters')) {
      const counters = this.tables.get('rate_limit_counters')!;
      const [key_hash, window_start] = this.boundValues;
      const found = counters.find(
        (c) => c.key_hash === key_hash && c.window_type === 'day' && c.window_start === window_start
      );
      return { success: true, results: found ? [{ count: found.count } as T] : [], meta: dummyMeta } as any;
    }

    if (q.includes('DELETE FROM rate_limit_counters')) {
      const counters = this.tables.get('rate_limit_counters')!;
      const cutoff = this.boundValues[0];
      const remaining = counters.filter((c) => c.window_start >= cutoff);
      this.tables.set('rate_limit_counters', remaining);
      return { success: true, meta: dummyMeta } as any;
    }

    // Users
    if (q.includes('INSERT INTO users')) {
      const users = this.tables.get('users')!;
      const [id, email, password_hash, created_at] = this.boundValues;
      users.push({ id, email, password_hash, plan: 'free', created_at });
      return { success: true, meta: { ...dummyMeta, changes: 1 } } as any;
    }

    if (q.includes('SELECT * FROM users WHERE email = ?')) {
      const users = this.tables.get('users')!;
      const email = this.boundValues[0];
      const found = users.find((u) => u.email === email);
      return { success: true, results: found ? [found as T] : [], meta: dummyMeta } as any;
    }

    if (q.includes('SELECT * FROM users WHERE id = ?')) {
      const users = this.tables.get('users')!;
      const id = this.boundValues[0];
      const found = users.find((u) => u.id === id);
      return { success: true, results: found ? [found as T] : [], meta: dummyMeta } as any;
    }

    if (q.includes('UPDATE users SET plan = ? WHERE id = ?')) {
      const users = this.tables.get('users')!;
      const [plan, id] = this.boundValues;
      const found = users.find((u) => u.id === id);
      if (found) found.plan = plan;
      return { success: true, meta: dummyMeta } as any;
    }

    // Abuse reports
    if (q.includes('INSERT INTO share_reports')) {
      const reports = this.tables.get('share_reports')!;
      const [id, share_id, reason, details, created_at] = this.boundValues;
      reports.push({ id, share_id, reason, details, created_at });
      return { success: true, meta: dummyMeta } as any;
    }

    // Retries
    if (q.includes('INSERT INTO cleanup_retries')) {
      const retries = this.tables.get('cleanup_retries')!;
      const [id, resource_type, resource_identifier, last_attempt_at, error_message] = this.boundValues;
      retries.push({ id, resource_type, resource_identifier, retry_count: 0, last_attempt_at, error_message });
      return { success: true, meta: dummyMeta } as any;
    }

    if (q.includes('FROM cleanup_retries') && q.startsWith('SELECT')) {
      const retries = this.tables.get('cleanup_retries')!;
      return { success: true, results: retries.filter((r) => r.retry_count < 5) as T[], meta: dummyMeta } as any;
    }

    if (q.includes('DELETE FROM cleanup_retries WHERE id = ?')) {
      const retries = this.tables.get('cleanup_retries')!;
      const id = this.boundValues[0];
      const idx = retries.findIndex((r) => r.id === id);
      if (idx !== -1) retries.splice(idx, 1);
      return { success: true, meta: dummyMeta } as any;
    }

    if (q.includes('UPDATE cleanup_retries SET retry_count = retry_count + 1')) {
      const retries = this.tables.get('cleanup_retries')!;
      const [now, err, id] = this.boundValues;
      const found = retries.find((r) => r.id === id);
      if (found) {
        found.retry_count++;
        found.last_attempt_at = now;
        found.error_message = err;
      }
      return { success: true, meta: dummyMeta } as any;
    }

    return { success: true, results: [], meta: dummyMeta } as any;
  }
}
