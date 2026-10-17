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
  r2_object_key: string | null;
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
  r2_key: string;
  password_hash: string | null;
  burn_after_read: number;
  allow_download: number;
  custom_alias: string | null;
  owner_id: string | null;
  created_at: number;
  expires_at: number;
  is_finalized: number;
}

export class ShareRepository {
  constructor(private db: D1Database) {}

  async createShare(record: Omit<ShareRecord, 'view_count' | 'is_burned' | 'is_deleted'>): Promise<void> {
    const query = `
      INSERT INTO shares (
        id, content_type, created_at, expires_at, title,
        text_content, text_format, syntax_language, original_filename,
        r2_object_key, file_mime_type, file_size, password_hash,
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
      record.r2_object_key,
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
    const query = `SELECT * FROM shares WHERE id = ? LIMIT 1`;
    return await this.db.prepare(query).bind(id).first<ShareRecord>();
  }

  async incrementViewCount(id: string): Promise<void> {
    const query = `UPDATE shares SET view_count = view_count + 1 WHERE id = ?`;
    await this.db.prepare(query).bind(id).run();
  }

  /**
   * Atomically mark burn-after-read share as burned.
   * Returns true if this operation won the race and burned the record.
   */
  async atomicBurnShare(id: string): Promise<boolean> {
    const query = `
      UPDATE shares 
      SET is_burned = 1, is_deleted = 1
      WHERE id = ? AND is_burned = 0 AND is_deleted = 0
    `;
    const result = await this.db.prepare(query).bind(id).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  async deleteShareByToken(id: string, tokenHash: string): Promise<boolean> {
    const query = `
      DELETE FROM shares
      WHERE id = ? AND deletion_token_hash = ?
    `;
    const result = await this.db.prepare(query).bind(id, tokenHash).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  async deleteShareByOwner(id: string, ownerId: string): Promise<boolean> {
    const query = `
      DELETE FROM shares
      WHERE id = ? AND owner_id = ?
    `;
    const result = await this.db.prepare(query).bind(id, ownerId).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  async purgeShare(id: string): Promise<void> {
    await this.db.prepare(`DELETE FROM shares WHERE id = ?`).bind(id).run();
  }

  async findExpiredShares(currentTimestamp: number, limit = 50): Promise<ShareRecord[]> {
    const query = `
      SELECT * FROM shares 
      WHERE expires_at <= ? OR is_burned = 1 OR is_deleted = 1
      LIMIT ?
    `;
    const { results } = await this.db.prepare(query).bind(currentTimestamp, limit).all<ShareRecord>();
    return results || [];
  }

  async getUserActiveShares(ownerId: string, currentTimestamp: number): Promise<ShareRecord[]> {
    const query = `
      SELECT * FROM shares 
      WHERE owner_id = ? AND expires_at > ? AND is_deleted = 0 AND is_burned = 0
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const { results } = await this.db.prepare(query).bind(ownerId, currentTimestamp).all<ShareRecord>();
    return results || [];
  }

  // Upload sessions
  async createUploadSession(session: UploadSessionRecord): Promise<void> {
    const query = `
      INSERT INTO upload_sessions (
        token, filename, file_size, file_mime_type, r2_key,
        password_hash, burn_after_read, allow_download, custom_alias,
        owner_id, created_at, expires_at, is_finalized
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    await this.db.prepare(query).bind(
      session.token,
      session.filename,
      session.file_size,
      session.file_mime_type,
      session.r2_key,
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
    return await this.db
      .prepare(`SELECT * FROM upload_sessions WHERE token = ? LIMIT 1`)
      .bind(token)
      .first<UploadSessionRecord>();
  }

  async finalizeUploadSession(token: string): Promise<void> {
    await this.db
      .prepare(`UPDATE upload_sessions SET is_finalized = 1 WHERE token = ?`)
      .bind(token)
      .run();
  }

  async deleteUploadSession(token: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM upload_sessions WHERE token = ?`)
      .bind(token)
      .run();
  }

  async findExpiredUploadSessions(currentTimestamp: number, limit = 50): Promise<UploadSessionRecord[]> {
    const query = `
      SELECT * FROM upload_sessions 
      WHERE expires_at <= ? OR is_finalized = 1
      LIMIT ?
    `;
    const { results } = await this.db.prepare(query).bind(currentTimestamp, limit).all<UploadSessionRecord>();
    return results || [];
  }

  // Rate limiting
  async incrementRateLimit(keyHash: string, windowType: string, windowStart: number): Promise<number> {
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
    const query = `
      SELECT count FROM rate_limit_counters 
      WHERE key_hash = ? AND window_type = 'day' AND window_start = ?
      LIMIT 1
    `;
    const row = await this.db.prepare(query).bind(keyHash, dayStart).first<{ count: number }>();
    return row?.count ?? 0;
  }

  async cleanupRateLimits(cutoff: number): Promise<void> {
    await this.db
      .prepare(`DELETE FROM rate_limit_counters WHERE window_start < ?`)
      .bind(cutoff)
      .run();
  }

  // Abuse reports
  async createAbuseReport(id: string, shareId: string, reason: string, details: string | null, now: number): Promise<void> {
    const query = `
      INSERT INTO share_reports (id, share_id, reason, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    await this.db.prepare(query).bind(id, shareId, reason, details, now).run();
  }

  // Retry cleanup queue
  async enqueueRetry(id: string, type: 'r2_image' | 'd1_share', identifier: string, error: string, now: number): Promise<void> {
    const query = `
      INSERT INTO cleanup_retries (id, resource_type, resource_identifier, retry_count, last_attempt_at, error_message)
      VALUES (?, ?, ?, 0, ?, ?)
    `;
    await this.db.prepare(query).bind(id, type, identifier, now, error).run();
  }

  async getCleanupRetries(limit = 20): Promise<{ id: string; resource_type: string; resource_identifier: string; retry_count: number }[]> {
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
    await this.db.prepare(`DELETE FROM cleanup_retries WHERE id = ?`).bind(id).run();
  }

  async incrementCleanupRetry(id: string, now: number, error: string): Promise<void> {
    const query = `
      UPDATE cleanup_retries 
      SET retry_count = retry_count + 1, last_attempt_at = ?, error_message = ?
      WHERE id = ?
    `;
    await this.db.prepare(query).bind(now, error, id).run();
  }
}
