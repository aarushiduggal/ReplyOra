-- ReplyOra Social — real publishing (Instagram + TikTok, direct APIs).
-- Run once in the Neon SQL editor, AFTER 0003_agency_clients.sql.
--
-- Adds: per-client OAuth connections (tokens), and the media + publish-tracking
-- columns on social_posts. Everything stays scoped by workspace_id + client_id.

-- ── Per-client social connections (OAuth tokens) ──────────────────────────
CREATE TABLE IF NOT EXISTS client_connections (
  id                  TEXT PRIMARY KEY,
  workspace_id        TEXT NOT NULL,
  client_id           TEXT NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  platform            TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  -- The platform account we post to (IG Business account id / TikTok open id).
  external_account_id TEXT,
  external_username   TEXT,
  access_token        TEXT,
  refresh_token       TEXT,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, platform)
);
CREATE INDEX IF NOT EXISTS client_connections_workspace_idx
  ON client_connections (workspace_id);
CREATE INDEX IF NOT EXISTS client_connections_client_idx
  ON client_connections (client_id);

-- ── Publishing columns on social_posts ────────────────────────────────────
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS media_url        TEXT;
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS media_kind       TEXT;      -- 'image' | 'video'
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS external_post_id TEXT;      -- id returned by IG/TikTok
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS published_at     TIMESTAMPTZ;
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS publish_error    TEXT;      -- last failure, if any

-- Allow a 'failed' status alongside draft/scheduled/published (no CHECK today,
-- so nothing to alter — statuses are enforced in the app layer).
