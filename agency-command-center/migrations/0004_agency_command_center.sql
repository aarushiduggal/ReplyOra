-- 0004_agency_command_center.sql
-- ReplyOra — Agency Command Center: team, roles, per-client assignment,
-- retainers (recurring billing), and task ownership.
-- Safe to run once. All tables are additive; nothing existing is altered
-- except a nullable `assignee_id` column added to `tasks` (guarded).

-- ─────────────────────────────  TEAM  ──────────────────────────────
create table if not exists team_members (
  id           text primary key,
  agency_id    text        not null default 'default',      -- one agency per install for now
  name         text        not null,
  email        text        not null,
  role         text        not null default 'editor',        -- owner | manager | editor | viewer
  avatar_url   text,
  status       text        not null default 'active',         -- active | invited | disabled
  weekly_capacity int      not null default 25,               -- posts/week this person can carry
  created_at   timestamptz not null default now(),
  unique (agency_id, email)
);

create index if not exists team_members_agency_idx on team_members (agency_id);

-- Which members are assigned to which client, and their role on that client.
create table if not exists client_assignments (
  client_id    text        not null,
  member_id    text        not null references team_members (id) on delete cascade,
  role_on_client text      not null default 'editor',         -- lead | editor | viewer
  created_at   timestamptz not null default now(),
  primary key (client_id, member_id)
);

create index if not exists client_assignments_member_idx on client_assignments (member_id);
create index if not exists client_assignments_client_idx on client_assignments (client_id);

-- ────────────────────────────  RETAINERS  ──────────────────────────
-- A recurring plan attached to a client. When Stripe keys are present the
-- retainer is backed by a Stripe subscription; otherwise it runs "manually"
-- and simply generates the next invoice on `next_invoice_at`.
create table if not exists retainers (
  id                    text        primary key,
  client_id             text        not null,
  name                  text        not null default 'Monthly retainer',
  amount_cents          integer     not null,                 -- e.g. 200000 = $2,000.00
  currency              text        not null default 'AUD',
  interval              text        not null default 'month', -- week | month | quarter
  status                text        not null default 'active',-- active | paused | cancelled
  anchor_day            integer     not null default 1,       -- day-of-month the invoice cuts
  next_invoice_at       timestamptz,
  last_invoiced_at      timestamptz,
  stripe_customer_id    text,
  stripe_subscription_id text,
  auto_charge           boolean     not null default false,   -- true once Stripe is live
  created_at            timestamptz not null default now()
);

create index if not exists retainers_client_idx on retainers (client_id);
create index if not exists retainers_next_idx on retainers (status, next_invoice_at);

-- ─────────────────────────  TASK OWNERSHIP  ────────────────────────
-- The Command Center's capacity view needs to know who owns each task.
-- Added defensively in case `tasks` already exists from 000x.
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'tasks') then
    if not exists (
      select 1 from information_schema.columns
      where table_name = 'tasks' and column_name = 'assignee_id'
    ) then
      alter table tasks add column assignee_id text;
      create index if not exists tasks_assignee_idx on tasks (assignee_id);
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_name = 'tasks' and column_name = 'client_id'
    ) then
      alter table tasks add column client_id text;
      create index if not exists tasks_client_idx on tasks (client_id);
    end if;
  end if;
end $$;
