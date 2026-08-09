-- 0013_admin_audit.sql
-- Staff action audit trail for the Neon/Auth.js product (the legacy audit_logs
-- lived in Supabase). Every staff plan/add-on/cancel/impersonation write logs a
-- row here. Safe to run more than once.

CREATE TABLE IF NOT EXISTS admin_audit (
  id            TEXT PRIMARY KEY,
  actor_email   TEXT NOT NULL,
  action        TEXT NOT NULL,
  workspace_id  TEXT,
  detail        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON admin_audit (created_at DESC);
