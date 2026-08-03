-- ============================================================
-- Replyora — Feature waitlist ("Notify me" signups)
-- Captures interest in upcoming roadmap features (e.g. voice/phone
-- answering) from the public marketing site and the dashboard, so we
-- can gauge demand before building.
--   * Inserts happen server-side via the SERVICE ROLE (public /api/waitlist),
--     the same pattern as the public chat path — no anon RLS insert policy.
--   * Reads happen only in the staff portal via the service role.
-- Apply after 0002_platform_admin.sql.
-- ============================================================

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  feature text not null default 'voice',   -- which upcoming feature
  source text not null default 'roadmap',  -- roadmap | dashboard | ...
  workspace_id uuid references public.workspaces on delete set null,
  created_at timestamptz default now()
);

-- One row per email per feature (idempotent "notify me").
create unique index if not exists waitlist_signups_email_feature_idx
  on public.waitlist_signups (lower(email), feature);

create index if not exists waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at desc);

-- RLS on, with NO public policies: writes/reads go through the service role
-- server-side only (mirrors platform_admins / audit_logs handling).
alter table public.waitlist_signups enable row level security;
