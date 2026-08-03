-- ============================================================
-- Replyora — initial schema, RLS, tenant bootstrap, vector search
-- Multi-tenant SaaS. Tenant key = workspace_id on every table.
-- Apply in Supabase SQL editor or via `supabase db push`.
-- ============================================================

-- ---------- extensions ----------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;   -- gen_random_bytes for public keys
create extension if not exists vector;      -- pgvector for embeddings

-- ============================================================
-- TABLES
-- ============================================================

-- 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- tenants
create table if not exists public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'My Workspace',
  slug text unique not null,
  owner_id uuid not null references auth.users on delete cascade,
  plan text not null default 'none',           -- none|starter|growth|pro ('none' = no active subscription)
  plan_status text not null default 'trialing',-- trialing|active|past_due|canceled
  trial_ends_at timestamptz default (now() + interval '7 days'),
  setup_fee_paid boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);
create index if not exists workspaces_owner_idx on public.workspaces(owner_id);

create table if not exists public.workspace_members (
  workspace_id uuid references public.workspaces on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null default 'member',         -- owner|admin|member
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);
create index if not exists members_user_idx on public.workspace_members(user_id);

create table if not exists public.business_profiles (
  workspace_id uuid primary key references public.workspaces on delete cascade,
  industry text, description text, website text,
  phone text, email text, address text,
  hours jsonb,
  timezone text default 'Australia/Sydney',
  updated_at timestamptz default now()
);

create table if not exists public.knowledge_sources (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  type text not null,        -- text|faq|file|url|pricing|service
  title text,
  storage_path text,
  status text not null default 'pending',  -- pending|processing|ready|failed
  error text,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists sources_ws_idx on public.knowledge_sources(workspace_id);

create table if not exists public.knowledge_chunks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  source_id uuid not null references public.knowledge_sources on delete cascade,
  content text not null,
  embedding vector(1536),    -- text-embedding-3-small
  token_count int,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists chunks_ws_idx on public.knowledge_chunks(workspace_id);
-- ANN index; build after you have data, tune `lists` to ~sqrt(rows)
create index if not exists chunks_embedding_idx
  on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists public.assistants (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  public_key text unique not null,
  name text default 'Assistant',
  tone text default 'friendly',
  system_prompt text,
  model text default 'claude-haiku',
  temperature numeric default 0.3,
  brand_color text default '#5C1A1A',
  welcome_message text default 'Hi! How can I help you today?',
  suggested_questions jsonb default '[]'::jsonb,
  lead_fields jsonb default '[{"key":"name","required":true},{"key":"email","required":true},{"key":"phone","required":false}]'::jsonb,
  allowed_domains text[] default '{}',
  status text default 'active',
  created_at timestamptz default now()
);
create index if not exists assistants_ws_idx on public.assistants(workspace_id);
create index if not exists assistants_pk_idx on public.assistants(public_key);

create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  assistant_id uuid references public.assistants on delete set null,
  visitor_id text,
  channel text default 'web',
  page_url text,
  status text default 'open',     -- open|closed
  started_at timestamptz default now(),
  last_message_at timestamptz default now()
);
create index if not exists conversations_ws_idx on public.conversations(workspace_id);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  role text not null,             -- user|assistant|system
  content text not null,
  citations jsonb,
  tokens int,
  created_at timestamptz default now()
);
create index if not exists messages_conv_idx on public.messages(conversation_id);

create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  conversation_id uuid references public.conversations on delete set null,
  name text, email text, phone text,
  intent text,
  qualification jsonb,
  status text default 'new',      -- new|qualified|booked|lost
  created_at timestamptz default now()
);
create index if not exists leads_ws_idx on public.leads(workspace_id);

create table if not exists public.usage_counters (
  workspace_id uuid references public.workspaces on delete cascade,
  period_start date not null,
  messages_used int default 0,
  leads_count int default 0,
  primary key (workspace_id, period_start)
);

create table if not exists public.stripe_events (
  id text primary key,
  type text,
  processed_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces on delete cascade,
  actor_id uuid,
  action text, target text, metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists audit_ws_idx on public.audit_logs(workspace_id);

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- ============================================================

create or replace function public.is_member(p_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace and user_id = auth.uid()
  );
$$;

create or replace function public.is_admin(p_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace and user_id = auth.uid()
      and role in ('owner','admin')
  );
$$;

-- ============================================================
-- TENANT BOOTSTRAP: on new auth user, create profile + workspace
-- + owner membership + business profile + assistant + usage row
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, extensions as $$
declare
  v_workspace uuid;
  -- Use built-in gen_random_uuid() (pg_catalog) so we don't depend on which
  -- schema pgcrypto/uuid-ossp live in.
  v_slug text := 'ws-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  v_pubkey text := 'rk_' || replace(gen_random_uuid()::text, '-', '')
                        || replace(gen_random_uuid()::text, '-', '');
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.workspaces (name, slug, owner_id)
  values ('My Workspace', v_slug, new.id)
  returning id into v_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace, new.id, 'owner');

  insert into public.business_profiles (workspace_id) values (v_workspace);

  insert into public.assistants (workspace_id, public_key)
  values (v_workspace, v_pubkey);

  insert into public.usage_counters (workspace_id, period_start)
  values (v_workspace, date_trunc('month', now())::date);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- VECTOR SEARCH RPC (always tenant-filtered)
-- ============================================================

create or replace function public.match_chunks(
  p_workspace uuid,
  p_query vector(1536),
  p_match_count int default 6
) returns table (content text, similarity float, metadata jsonb)
language sql stable as $$
  select content,
         1 - (embedding <=> p_query) as similarity,
         metadata
  from public.knowledge_chunks
  where workspace_id = p_workspace
  order by embedding <=> p_query
  limit p_match_count;
$$;

-- ============================================================
-- ROW-LEVEL SECURITY
-- Authenticated users act only within workspaces they belong to.
-- The public chat path uses the SERVICE ROLE (bypasses RLS) and
-- MUST hard-filter every query by the resolved workspace_id.
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.workspaces          enable row level security;
alter table public.workspace_members   enable row level security;
alter table public.business_profiles   enable row level security;
alter table public.knowledge_sources   enable row level security;
alter table public.knowledge_chunks    enable row level security;
alter table public.assistants          enable row level security;
alter table public.conversations       enable row level security;
alter table public.messages            enable row level security;
alter table public.leads               enable row level security;
alter table public.usage_counters      enable row level security;
alter table public.audit_logs          enable row level security;
-- stripe_events: no policies -> only service role can touch it.
alter table public.stripe_events       enable row level security;

-- profiles: a user sees/edits only their own row
create policy "own profile read"   on public.profiles for select using (id = auth.uid());
create policy "own profile write"  on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());

-- workspaces: members read; owner/admin update; any authed user can create (they become owner via app logic)
create policy "ws read"   on public.workspaces for select using (public.is_member(id));
create policy "ws update" on public.workspaces for update using (public.is_admin(id)) with check (public.is_admin(id));
create policy "ws insert" on public.workspaces for insert with check (owner_id = auth.uid());

-- workspace_members: members can read the roster; admins manage it
create policy "members read"   on public.workspace_members for select using (public.is_member(workspace_id));
create policy "members insert" on public.workspace_members for insert with check (public.is_admin(workspace_id));
create policy "members update" on public.workspace_members for update using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));
create policy "members delete" on public.workspace_members for delete using (public.is_admin(workspace_id));

-- generic per-tenant tables: members can do everything within their workspace
create policy "bp all"   on public.business_profiles for all using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy "ks all"   on public.knowledge_sources for all using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy "kc all"   on public.knowledge_chunks  for all using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy "as all"   on public.assistants        for all using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy "conv all" on public.conversations     for all using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy "msg all"  on public.messages          for all using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy "lead all" on public.leads             for all using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy "usage read" on public.usage_counters  for select using (public.is_member(workspace_id));
create policy "audit read" on public.audit_logs      for select using (public.is_admin(workspace_id));

-- ============================================================
-- updated_at touch trigger (optional convenience)
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists bp_touch on public.business_profiles;
create trigger bp_touch before update on public.business_profiles
  for each row execute function public.touch_updated_at();

-- ============================================================
-- DONE. Next: storage bucket for KB files (create in dashboard or:)
--   insert into storage.buckets (id, name, public) values ('kb','kb', false);
-- then add Storage RLS so paths are prefixed by workspace_id.
-- ============================================================
