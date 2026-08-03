-- ============================================================
-- Replyora — Platform Staff Portal (super-admin) layer
-- Adds a separate "platform admin / staff" role that can access
-- ALL workspaces. This deliberately sits ABOVE tenant isolation,
-- so it must be tightly controlled:
--   * staff access happens server-side via the SERVICE ROLE only,
--     gated in the app by is_platform_admin(auth.uid())
--   * every staff action is written to audit_logs
--   * the service role key is NEVER exposed to the browser
-- Apply after 0001_init.sql.
-- ============================================================

-- Who is Replyora staff (separate from per-business workspace_members)
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users on delete cascade,
  role text not null default 'staff',   -- staff | superadmin
  created_at timestamptz default now()
);

alter table public.platform_admins enable row level security;

-- Helper: is the current user Replyora staff?
create or replace function public.is_platform_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = uid);
$$;

-- Only staff can read the staff list; writes happen via service role (no insert/update policy).
drop policy if exists "staff read admins" on public.platform_admins;
create policy "staff read admins" on public.platform_admins
  for select using (public.is_platform_admin());

-- ============================================================
-- SEED YOURSELF AS THE FIRST ADMIN
-- 1) Sign in to the live app with Google at least once (creates your auth.users row).
-- 2) Find your user id:  Supabase → Authentication → Users → copy your UUID.
-- 3) Run (replace the UUID):
--
--    insert into public.platform_admins (user_id, role)
--    values ('YOUR-AUTH-USER-UUID', 'superadmin')
--    on conflict (user_id) do nothing;
--
-- After that, the /admin portal will let you in.
-- ============================================================

-- NOTE ON DATA ACCESS:
-- The staff portal reads/writes other workspaces using the SERVICE ROLE
-- (which bypasses RLS) from server-side code ONLY, and every handler must
-- call is_platform_admin() first. We do NOT weaken the per-tenant RLS
-- policies from 0001_init.sql — normal client access stays fully isolated.
