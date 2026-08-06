-- ReplyOra — account preferences + data requests.
-- Run once in Neon, after 0008_client_management.sql.

-- Monthly-newsletter opt-in, per account (shown in the staff portal accounts list).
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN NOT NULL DEFAULT false;

-- Data / account deletion requests (Settings → Data).
CREATE TABLE IF NOT EXISTS deletion_requests (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_email   TEXT,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS deletion_requests_ws_idx ON deletion_requests (workspace_id);

-- Approvals: agency reply to a client's change request + its resolution state
-- (pending | resolved | unresolved). Lets the agency answer "here are the
-- changes" and mark whether the request is handled.
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS agency_reply TEXT;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS resolution   TEXT;
