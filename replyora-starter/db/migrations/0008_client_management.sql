-- ReplyOra Social — extensive client management (brand kit, brief, features,
-- billing, invites). Run once in Neon, AFTER 0007_postpeer_profiles.sql.
-- Everything is per-client and stays scoped by workspace_id + client_id.

-- ── Client profile / brand fields (all optional) ──────────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_voice     TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS package_plan    TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS started_on      DATE;
-- Brand kit
ALTER TABLE clients ADD COLUMN IF NOT EXISTS logo_url        TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_colors    JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS font_display    TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS font_body       TEXT;
-- Brand brief (freeform notes; PDFs live in knowledge_sources)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brief_notes     TEXT;
-- Per-client feature toggles + per-client billing overrides
ALTER TABLE clients ADD COLUMN IF NOT EXISTS features        JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing         JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ── Brand-brief strategy PDFs (knowledge_sources gets a public URL) ───────
ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS url TEXT;

-- ── Client portal invites (Access tab) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_invites (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  client_id    TEXT NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  recipient    TEXT,
  email        TEXT,
  role         TEXT NOT NULL DEFAULT 'client',
  token        TEXT NOT NULL,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_invites_client_idx ON client_invites (client_id);
