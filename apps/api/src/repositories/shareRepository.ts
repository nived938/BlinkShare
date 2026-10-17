export interface ShareRecord {
  id: string;
  content_type: 'text' | 'image';
  created_at: number;
  expires_at: number;
  title: string | null;
  text_content: string | null;
  text_format: string | null;
  syntax_language: string | null;
  original_filename: string | null;
  storage_key: string | null;
  r2_object_key?: string | null; // backward compatibility alias
  file_mime_type: string | null;
  file_size: number | null;
  password_hash: string | null;
  burn_after_read: number;
  owner_id: string | null;
  deletion_token_hash: string | null;
  view_count: number;
  is_burned: number;
  is_deleted: number;
  allow_download: number;
}

export interface UploadSessionRecord {
  token: string;
  filename: string;
  file_size: number;
  file_mime_type: string;
  storage_key: string;
  r2_key?: string; // backward compatibility alias
  password_hash: string | null;
  burn_after_read: number;
  allow_download: number;
  custom_alias: string | null;
  owner_id: string | null;
  created_at: number;
  expires_at: number;
  is_finalized: number;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image')),
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    title TEXT,
    text_content TEXT,
    text_format TEXT DEFAULT 'plain_text',
    syntax_language TEXT DEFAULT 'plaintext',
    original_filename TEXT,
    storage_key TEXT,
    file_mime_type TEXT,
    file_size INTEGER,
    password_hash TEXT,
    burn_after_read INTEGER NOT NULL DEFAULT 0,
    owner_id TEXT,
    deletion_token_hash TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    is_burned INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    allow_download INTEGER NOT NULL DEFAULT 1
  );`,
  `CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);`,
  `CREATE INDEX IF NOT EXISTS idx_shares_owner_id ON shares(owner_id);`,
  `CREATE INDEX IF NOT EXISTS idx_shares_deletion_token ON shares(deletion_token_hash);`,
  `CREATE INDEX IF NOT EXISTS idx_shares_active ON shares(is_deleted, is_burned, expires_at);`,
  `CREATE TABLE IF NOT EXISTS upload_sessions (
    token TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_mime_type TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    password_hash TEXT,
    burn_after_read INTEGER NOT NULL DEFAULT 0,
    allow_download INTEGER NOT NULL DEFAULT 1,
    custom_alias TEXT,
    owner_id TEXT,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    is_finalized INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE INDEX IF NOT EXISTS idx_upload_sessions_expires_at ON upload_sessions(expires_at);`,
  `CREATE TABLE IF NOT EXISTS rate_limit_counters (
    key_hash TEXT NOT NULL,
    window_type TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (key_hash, window_type, window_start)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup ON rate_limit_counters(window_start);`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS share_reports (
    id TEXT PRIMARY KEY,
    share_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS cleanup_retries (
    id TEXT PRIMARY KEY,
    resource_type TEXT NOT NULL,
    resource_identifier TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at INTEGER NOT NULL,
    error_message TEXT
  );`
];

let isSchemaReady = false;

export class ShareRepository {
  constructor(private db: D1Database) {}

  async ensureSchema(): Promise<void> {
    if (isSchemaReady) return;
    try {
      await this.db.prepare('SELECT 1 FROM rate_limit_counters LIMIT 1').first();
      isSchemaReady = true;
    } catch {
      for (const statement of SCHEMA_STATEMENTS) {
        try {
          await this.db.prepare(statement).run();
        } catch {}
      }
      isSchemaReady = true;
    }
  }

  async createShare(record: Omit<ShareRecord, 'view_count' | 'is_burned' | 'is_deleted'>): Promise<void> {
    await this.ensureSchema();
    const storageKey = record.storage_key || record.r2_object_key || null;
    const query = `
      INSERT INTO shares (
        id, content_type, created_at, expires_at, title,
        text_content, text_format, syntax_language, original_filename,
        storage_key, file_mime_type, file_size, password_hash,
        burn_after_read, owner_id, deletion_token_hash, view_count,
        is_burned, is_deleted, allow_download
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
    `;

    await this.db.prepare(query).bind(
      record.id,
      record.content_type,
      record.created_at,
      record.expires_at,
      record.title,
      record.text_content,
      record.text_format,
      record.syntax_language,
      record.original_filename,
      storageKey,
      record.file_mime_type,
      record.file_size,
      record.password_hash,
      record.burn_after_read,
      record.owner_id,
      record.deletion_token_hash,
      record.allow_download
    ).run();
  }

  async getShareById(id: string): Promise<ShareRecord | null> {
    await this.ensureSchema();
    const query = `SELECT * FROM shares WHERE id = ? LIMIT 1`;
    const row = await this.db.prepare(query).bind(id).first<any>();
    if (!row) return null;
    return {
      ...row,
      storage_key: row.storage_key || row.r2_object_key || null,
      r2_object_key: row.storage_key || row.r2_object_key || null,
    };
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.ensureSchema();
    const query = `UPDATE shares SET view_count = view_count + 1 WHERE id = ?`;
    await this.db.prepare(query).bind(id).run();
  }

  async atomicBurnShare(id: string): Promise<boolean> {
    await this.ensureSchema();
    const query = `
      UPDATE shares 
      SET is_burned = 1, is_deleted = 1
      WHERE id = ? AND is_burned = 0 AND is_deleted = 0
    `;
    const result = await this.db.prepare(query).bind(id).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  async deleteShareByToken(id: string, tokenHash: string): Promise<boolean> {
    await this.ensureSchema();
    const query = `
      DELETE FROM shares
      WHERE id = ? AND deletion_token_hash = ?
    `;
    const result = await this.db.prepare(query).bind(id, tokenHash).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  async deleteShareByOwner(id: string, ownerId: string): Promise<boolean> {
    await this.ensureSchema();
    const query = `
      DELETE FROM shares
      WHERE id = ? AND owner_id = ?
    `;
    const result = await this.db.prepare(query).bind(id, ownerId).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  async purgeShare(id: string): Promise<void> {
    await this.ensureSchema();
    await this.db.prepare(`DELETE FROM shares WHERE id = ?`).bind(id).run();
  }

  async findExpiredShares(currentTimestamp: number, limit = 50): Promise<ShareRecord[]> {
    await this.ensureSchema();
    const query = `
      SELECT * FROM shares 
      WHERE (expires_at <= ? OR is_burned = 1 OR is_deleted = 1)
      LIMIT ?
    `;
    const { results } = await this.db.prepare(query).bind(currentTimestamp, limit).all<any>();
    return (results || []).map((row) => ({
      ...row,
      storage_key: row.storage_key || row.r2_object_key || null,
      r2_object_key: row.storage_key || row.r2_object_key || null,
    }));
  }

  async getUserShares(ownerId: string, limit = 50): Promise<ShareRecord[]> {
    await this.ensureSchema();
    const query = `
      SELECT * FROM shares 
      WHERE owner_id = ? AND is_deleted = 0
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const { results } = await this.db.prepare(query).bind(ownerId, limit).all<any>();
    return (results || []).map((row) => ({
      ...row,
      storage_key: row.storage_key || row.r2_object_key || null,
      r2_object_key: row.storage_key || row.r2_object_key || null,
    }));
  }

  async getUserActiveShares(ownerId: string, currentTimestamp: number, limit = 50): Promise<ShareRecord[]> {
    await this.ensureSchema();
    const query = `
      SELECT * FROM shares 
      WHERE owner_id = ? AND is_deleted = 0 AND expires_at > ?
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const { results } = await this.db.prepare(query).bind(ownerId, currentTimestamp, limit).all<any>();
    return (results || []).map((row) => ({
      ...row,
      storage_key: row.storage_key || row.r2_object_key || null,
      r2_object_key: row.storage_key || row.r2_object_key || null,
    }));
  }

  // Upload sessions for staged image uploads
  async createUploadSession(session: UploadSessionRecord): Promise<void> {
    await this.ensureSchema();
    const storageKey = session.storage_key || session.r2_key;
    const query = `
      INSERT INTO upload_sessions (
        token, filename, file_size, file_mime_type, storage_key,
        password_hash, burn_after_read, allow_download, custom_alias,
        owner_id, created_at, expires_at, is_finalized
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    await this.db.prepare(query).bind(
      session.token,
      session.filename,
      session.file_size,
      session.file_mime_type,
      storageKey,
      session.password_hash,
      session.burn_after_read,
      session.allow_download,
      session.custom_alias,
      session.owner_id,
      session.created_at,
      session.expires_at
    ).run();
  }

  async getUploadSession(token: string): Promise<UploadSessionRecord | null> {
    await this.ensureSchema();
    const query = `SELECT * FROM upload_sessions WHERE token = ? LIMIT 1`;
    const row = await this.db.prepare(query).bind(token).first<any>();
    if (!row) return null;
    return {
      ...row,
      storage_key: row.storage_key || row.r2_key,
      r2_key: row.storage_key || row.r2_key,
    };
  }

  async finalizeUploadSession(token: string): Promise<void> {
    await this.ensureSchema();
    await this.db
      .prepare(`UPDATE upload_sessions SET is_finalized = 1 WHERE token = ?`)
      .bind(token)
      .run();
  }

  async deleteUploadSession(token: string): Promise<void> {
    await this.ensureSchema();
    await this.db
      .prepare(`DELETE FROM upload_sessions WHERE token = ?`)
      .bind(token)
      .run();
  }

  async findExpiredUploadSessions(currentTimestamp: number, limit = 50): Promise<UploadSessionRecord[]> {
    await this.ensureSchema();
    const query = `
      SELECT * FROM upload_sessions 
      WHERE expires_at <= ? OR is_finalized = 1
      LIMIT ?
    `;
    const { results } = await this.db.prepare(query).bind(currentTimestamp, limit).all<any>();
    return (results || []).map((row) => ({
      ...row,
      storage_key: row.storage_key || row.r2_key,
      r2_key: row.storage_key || row.r2_key,
    }));
  }

  // Rate limiting & quota checks
  async incrementRateLimit(keyHash: string, windowType: string, windowStart: number): Promise<number> {
    await this.ensureSchema();
    const query = `
      INSERT INTO rate_limit_counters (key_hash, window_type, window_start, count)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(key_hash, window_type, window_start)
      DO UPDATE SET count = count + 1
      RETURNING count;
    `;
    const row = await this.db.prepare(query).bind(keyHash, windowType, windowStart).first<{ count: number }>();
    return row?.count ?? 1;
  }

  async getDailyShareCount(keyHash: string, dayStart: number): Promise<number> {
    await this.ensureSchema();
    const query = `
      SELECT count FROM rate_limit_counters 
      WHERE key_hash = ? AND window_type = 'day' AND window_start = ?
      LIMIT 1
    `;
    const row = await this.db.prepare(query).bind(keyHash, dayStart).first<{ count: number }>();
    return row?.count ?? 0;
  }

  async cleanupRateLimits(cutoff: number): Promise<void> {
    await this.ensureSchema();
    await this.db
      .prepare(`DELETE FROM rate_limit_counters WHERE window_start < ?`)
      .bind(cutoff)
      .run();
  }

  // Global platform-wide usage metrics (protecting free tier limits)
  async getActiveStorageMetrics(now: number): Promise<{ activeCount: number; activeBytes: number }> {
    await this.ensureSchema();
    const query = `
      SELECT count(*) as activeCount, coalesce(sum(file_size), 0) as activeBytes
      FROM shares
      WHERE is_deleted = 0 AND is_burned = 0 AND expires_at > ?
    `;
    const row = await this.db.prepare(query).bind(now).first<{ activeCount: number; activeBytes: number }>();
    return {
      activeCount: row?.activeCount ?? 0,
      activeBytes: row?.activeBytes ?? 0,
    };
  }

  // Abuse reports
  async createAbuseReport(id: string, shareId: string, reason: string, details: string | null, now: number): Promise<void> {
    await this.ensureSchema();
    const query = `
      INSERT INTO share_reports (id, share_id, reason, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    await this.db.prepare(query).bind(id, shareId, reason, details, now).run();
  }

  // Retry cleanup queue
  async enqueueRetry(id: string, type: 'kv_image' | 'r2_image' | 'd1_share', identifier: string, error: string, now: number): Promise<void> {
    await this.ensureSchema();
    const query = `
      INSERT INTO cleanup_retries (id, resource_type, resource_identifier, retry_count, last_attempt_at, error_message)
      VALUES (?, ?, ?, 0, ?, ?)
    `;
    await this.db.prepare(query).bind(id, type, identifier, now, error).run();
  }

  async getCleanupRetries(limit = 20): Promise<{ id: string; resource_type: string; resource_identifier: string; retry_count: number }[]> {
    await this.ensureSchema();
    const query = `
      SELECT id, resource_type, resource_identifier, retry_count 
      FROM cleanup_retries
      WHERE retry_count < 5
      ORDER BY last_attempt_at ASC
      LIMIT ?
    `;
    const { results } = await this.db.prepare(query).bind(limit).all<{ id: string; resource_type: string; resource_identifier: string; retry_count: number }>();
    return results || [];
  }

  async deleteCleanupRetry(id: string): Promise<void> {
    await this.ensureSchema();
    await this.db.prepare(`DELETE FROM cleanup_retries WHERE id = ?`).bind(id).run();
  }

  async incrementCleanupRetry(id: string, now: number, error: string): Promise<void> {
    await this.ensureSchema();
    const query = `
      UPDATE cleanup_retries 
      SET retry_count = retry_count + 1, last_attempt_at = ?, error_message = ?
      WHERE id = ?
    `;
    await this.db.prepare(query).bind(now, error, id).run();
  }
}
