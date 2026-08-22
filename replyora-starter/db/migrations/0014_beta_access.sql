-- 0014_beta_access.sql
-- Closed beta: invite-only signup, a public waitlist, and a 30-day free window.
--
-- WHY THE WAITLIST IS HERE: an earlier waitlist lived in supabase/migrations/
-- (0003_waitlist.sql) on the Supabase path. This deploy runs on Neon, so
-- USE_SUPABASE is false and every signup went to an in-memory store that dies
-- with the serverless instance. Those signups were silently lost. This table is
-- on the path the live site actually uses.
--
-- Safe to run more than once.

-- ── Invites ────────────────────────────────────────────────────────────────
-- One row per invite link. Codes are single-use: redeeming stamps used_at, and
-- a used code is refused from then on.
CREATE TABLE IF NOT EXISTS beta_invites (
  code          TEXT PRIMARY KEY,
  -- Free-text note so you know who you sent it to ("Dan @ Nook Cafe").
  label         TEXT,
  -- Optional: lock an invite to one email. NULL = anyone with the link.
  email         TEXT,
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Set on redemption. NULL means still open.
  used_at       TIMESTAMPTZ,
  used_by_email TEXT,
  used_by_user  TEXT,
  -- Lets you kill a link you sent to the wrong person.
  revoked_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS beta_invites_created_idx ON beta_invites (created_at DESC);
CREATE INDEX IF NOT EXISTS beta_invites_open_idx ON beta_invites (used_at) WHERE used_at IS NULL;

-- ── Waitlist ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  name        TEXT,
  company     TEXT,
  -- "agency" | "social media manager" | "business owner" | other
  role        TEXT,
  -- How many clients they handle — tells you if they're a real fit for the beta.
  clients     TEXT,
  note        TEXT,
  source      TEXT NOT NULL DEFAULT 'site',
  -- new | invited | declined
  status      TEXT NOT NULL DEFAULT 'new',
  -- Set when you generate an invite for this person, so the portal can show it.
  invite_code TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per email. Signing up twice is a no-op, not a duplicate or an error.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_lower_idx ON waitlist (lower(email));
CREATE INDEX IF NOT EXISTS waitlist_created_idx ON waitlist (created_at DESC);
CREATE INDEX IF NOT EXISTS waitlist_status_idx ON waitlist (status);

-- ── The 30-day free window ─────────────────────────────────────────────────
-- Stamped at redemption. While now() < beta_expires_at the account has full
-- access with no card and no trial countdown; after it, the paywall offers to
-- add a card. NULL = not a beta account, so normal billing applies.
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_expires_at TIMESTAMPTZ;
-- Which invite let them in — kept for support ("who did I send this to?").
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_invite_code TEXT;

CREATE INDEX IF NOT EXISTS users_beta_expires_idx ON users (beta_expires_at)
  WHERE beta_expires_at IS NOT NULL;
