-- ReplyOra Social — Neon (Postgres) schema
-- Run this once in the Neon SQL editor (see ReplyOra_Social_GoLive_Netlify_Neon.md).

CREATE TABLE IF NOT EXISTS social_posts (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  pillar        TEXT NOT NULL,
  topic         TEXT NOT NULL,
  caption       TEXT NOT NULL,
  hashtags      TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'scheduled', 'published')),
  scheduled_for TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_posts_workspace_idx
  ON social_posts (workspace_id);

CREATE INDEX IF NOT EXISTS social_posts_schedule_idx
  ON social_posts (workspace_id, scheduled_for);
