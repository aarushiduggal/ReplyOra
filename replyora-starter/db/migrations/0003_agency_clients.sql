-- ReplyOra Social — Agency → Client model
-- Run once in the Neon SQL editor, AFTER 0001_social_posts.sql and 0002_auth.sql.
--
-- TEXT ids throughout (matching social_posts). Every row is scoped by
-- workspace_id (the agency's Auth.js workspace) and, where relevant, by
-- client_id. Client-owned rows cascade-delete with the client.

-- ── Clients (the brands an agency manages) ────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                   TEXT PRIMARY KEY,
  workspace_id         TEXT NOT NULL,
  name                 TEXT NOT NULL,
  handle               TEXT,
  avatar_url           TEXT,
  platforms            TEXT[] NOT NULL DEFAULT '{}',
  package_deliverables TEXT,
  private_notes        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clients_workspace_idx ON clients (workspace_id);

-- ── Content pillars per client ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pillars (
  id        TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  colour    TEXT
);
CREATE INDEX IF NOT EXISTS pillars_client_idx ON pillars (client_id);

-- ── Instagram-style profile preview (one per client) ──────────────────────
CREATE TABLE IF NOT EXISTS profile_preview (
  client_id    TEXT PRIMARY KEY REFERENCES clients (id) ON DELETE CASCADE,
  username     TEXT,
  display_name TEXT,
  followers    TEXT,
  following    TEXT,
  bio          TEXT,
  website      TEXT
);

-- ── Media library ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  client_id    TEXT REFERENCES clients (id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('image', 'video')),
  folder       TEXT,
  uploaded_by  TEXT NOT NULL DEFAULT 'agency'
               CHECK (uploaded_by IN ('agency', 'client')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assets_workspace_idx ON assets (workspace_id);
CREATE INDEX IF NOT EXISTS assets_client_idx ON assets (client_id);

-- ── Post approvals (client sign-off), one per post ────────────────────────
CREATE TABLE IF NOT EXISTS approvals (
  post_id     TEXT PRIMARY KEY REFERENCES social_posts (id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'changes')),
  client_note TEXT,
  decided_at  TIMESTAMPTZ
);

-- ── Invoices ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  client_id    TEXT REFERENCES clients (id) ON DELETE CASCADE,
  number       TEXT,
  issued_at    TIMESTAMPTZ,
  due_at       TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  currency     TEXT NOT NULL DEFAULT 'AUD',
  line_items   JSONB NOT NULL DEFAULT '[]',
  bill_to      JSONB,
  total_cents  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS invoices_workspace_idx ON invoices (workspace_id);
CREATE INDEX IF NOT EXISTS invoices_client_idx ON invoices (client_id);

-- ── Tasks (workspace-wide, or attached to a client) ───────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  client_id    TEXT REFERENCES clients (id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'todo'
               CHECK (status IN ('todo', 'in_progress', 'done')),
  due_at       TIMESTAMPTZ,
  sort_index   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS tasks_workspace_idx ON tasks (workspace_id);
CREATE INDEX IF NOT EXISTS tasks_client_idx ON tasks (client_id);

-- ── Per-workspace billing / branding (for invoices & reports) ─────────────
CREATE TABLE IF NOT EXISTS workspace_billing (
  workspace_id  TEXT PRIMARY KEY,
  business_name TEXT,
  logo_url      TEXT,
  address       JSONB,
  report_title  TEXT,
  tax_rate      NUMERIC(5, 2) NOT NULL DEFAULT 0,
  terms         TEXT,
  currency      TEXT NOT NULL DEFAULT 'AUD'
);

-- ── Per-client website assistant config ───────────────────────────────────
CREATE TABLE IF NOT EXISTS assistants (
  id                  TEXT PRIMARY KEY,
  client_id           TEXT NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  name                TEXT,
  tone                TEXT,
  brand_colour        TEXT,
  welcome_message     TEXT,
  suggested_questions JSONB NOT NULL DEFAULT '[]',
  lead_fields         JSONB NOT NULL DEFAULT '[]',
  public_key          TEXT,
  enabled             BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS assistants_client_idx ON assistants (client_id);
CREATE UNIQUE INDEX IF NOT EXISTS assistants_public_key_idx
  ON assistants (public_key) WHERE public_key IS NOT NULL;

-- ── Per-client knowledge-base sources ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id         TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  type       TEXT,
  title      TEXT,
  preview    TEXT,
  status     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS knowledge_sources_client_idx
  ON knowledge_sources (client_id);

-- ── Extend social_posts for the agency model ──────────────────────────────
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS client_id   TEXT REFERENCES clients (id) ON DELETE CASCADE;
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS order_index INTEGER;
CREATE INDEX IF NOT EXISTS social_posts_client_idx ON social_posts (client_id);
