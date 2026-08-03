-- ReplyOra — Auth.js (email + password / Google) on Neon Postgres
-- Milestone 2. Run once in the Neon SQL editor, after 0001_social_posts.sql.
--
-- Users authenticate via Auth.js (Credentials + Google). Each user gets their
-- OWN workspace on first sign-in; social_posts.workspace_id points at it, so
-- every account only ever sees its own posts.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  -- bcrypt hash for email+password users; NULL for Google-only accounts.
  password_hash TEXT,
  name          TEXT,
  image         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One account per email (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

CREATE TABLE IF NOT EXISTS workspaces (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON workspaces (owner_id);
