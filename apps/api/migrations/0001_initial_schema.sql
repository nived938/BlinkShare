-- 0001_initial_schema.sql: Core schema for BlinkShare

CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  title TEXT,
  text_content TEXT,
  text_format TEXT DEFAULT 'plain_text',
  syntax_language TEXT DEFAULT 'plaintext',
  original_filename TEXT,
  r2_object_key TEXT,
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
);

CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_shares_owner_id ON shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_shares_deletion_token ON shares(deletion_token_hash);
CREATE INDEX IF NOT EXISTS idx_shares_active ON shares(is_deleted, is_burned, expires_at);

CREATE TABLE IF NOT EXISTS upload_sessions (
  token TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_mime_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  password_hash TEXT,
  burn_after_read INTEGER NOT NULL DEFAULT 0,
  allow_download INTEGER NOT NULL DEFAULT 1,
  custom_alias TEXT,
  owner_id TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  is_finalized INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_expires_at ON upload_sessions(expires_at);

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  key_hash TEXT NOT NULL,
  window_type TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (key_hash, window_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup ON rate_limit_counters(window_start);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

CREATE TABLE IF NOT EXISTS share_reports (
  id TEXT PRIMARY KEY,
  share_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cleanup_retries (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_identifier TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER NOT NULL,
  error_message TEXT
);
