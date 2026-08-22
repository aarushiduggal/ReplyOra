import "server-only";

import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

/**
 * Waitlist — people asking for access to the closed beta, plus "notify me"
 * interest in roadmap features. One table, distinguished by `source`.
 *
 * Schema: db/migrations/0014_beta_access.sql
 *
 * REWRITTEN OFF A DEAD PATH: this used to call Supabase via createAdminClient()
 * and fall back to an in-memory mock when USE_SUPABASE was false. The live site
 * runs on Neon, so USE_SUPABASE is false there and EVERY signup went to a
 * process-global object that vanished with the serverless instance. Nothing
 * errored; the entries simply weren't there afterwards. It now writes to Neon,
 * the database the live site actually uses.
 */

const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export interface WaitlistInput {
  email: string;
  name?: string | null;
  company?: string | null;
  role?: string | null;
  clients?: string | null;
  note?: string | null;
  /** "beta" from the join form, "roadmap" from a notify-me box. */
  source?: string;
}

/** Local dev without a database keeps the form working end to end. */
const MEM: WaitlistEntry[] = [];

/**
 * Add someone. Idempotent per email — a second submit updates what they told us
 * rather than erroring, so a double tap on mobile is never a dead end.
 * Returns true if this was a brand-new signup (worth alerting on).
 */
export async function addWaitlistSignup(input: WaitlistInput): Promise<boolean> {
  const email = input.email.trim().toLowerCase();
  const source = (input.source ?? "beta").trim() || "beta";
  const clean = (v: string | null | undefined, max: number): string | null =>
    v?.trim() ? v.trim().slice(0, max) : null;

  const row = {
    name: clean(input.name, 120),
    company: clean(input.company, 160),
    role: clean(input.role, 80),
    clients: clean(input.clients, 40),
    note: clean(input.note, 1000),
  };

  if (!hasDb()) {
    const existing = MEM.find((w) => w.email === email);
    if (existing) {
      Object.assign(existing, row);
      return false;
    }
    MEM.unshift({
      id: `wl_${MEM.length}_${email}`,
      email,
      ...row,
      source,
      status: "new",
      inviteCode: null,
      createdAt: new Date().toISOString(),
    });
    return true;
  }

  const id = `wl_${randomBytes(9).toString("base64url")}`;
  // COALESCE keeps whatever they told us the first time if a later submit
  // leaves a field blank — a re-submit should never erase detail.
  const rows = (await sql()`
    INSERT INTO waitlist (id, email, name, company, role, clients, note, source)
    VALUES (${id}, ${email}, ${row.name}, ${row.company}, ${row.role},
            ${row.clients}, ${row.note}, ${source})
    ON CONFLICT (lower(email)) DO UPDATE SET
      name    = COALESCE(EXCLUDED.name,    waitlist.name),
      company = COALESCE(EXCLUDED.company, waitlist.company),
      role    = COALESCE(EXCLUDED.role,    waitlist.role),
      clients = COALESCE(EXCLUDED.clients, waitlist.clients),
      note    = COALESCE(EXCLUDED.note,    waitlist.note)
    RETURNING (xmax = 0) AS inserted
  `) as { inserted: boolean }[];
  return rows[0]?.inserted === true;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: string | null;
  clients: string | null;
  note: string | null;
  source: string;
  /** new | invited | declined */
  status: string;
  inviteCode: string | null;
  createdAt: string;
}

interface Row {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: string | null;
  clients: string | null;
  note: string | null;
  source: string;
  status: string;
  invite_code: string | null;
  created_at: string | Date;
}

/** Everyone on the list, newest first. Staff portal only. */
export async function listWaitlist(): Promise<WaitlistEntry[]> {
  if (!hasDb()) return [...MEM];
  try {
    const rows = (await sql()`
      SELECT id, email, name, company, role, clients, note, source, status,
             invite_code, created_at
      FROM waitlist ORDER BY created_at DESC LIMIT 1000
    `) as Row[];
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      company: r.company,
      role: r.role,
      clients: r.clients,
      note: r.note,
      source: r.source,
      status: r.status,
      inviteCode: r.invite_code,
      createdAt:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
    }));
  } catch (err) {
    console.error("[waitlist] listWaitlist failed", err);
    return [];
  }
}

/** How many are waiting — for the staff nav badge. */
export async function countNewWaitlist(): Promise<number> {
  if (!hasDb()) return MEM.filter((w) => w.status === "new").length;
  try {
    const rows = (await sql()`
      SELECT count(*)::int AS n FROM waitlist WHERE status = 'new'
    `) as { n: number }[];
    return rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

/** Attach a generated invite to a waitlist row and mark them invited. */
export async function markInvited(email: string, code: string): Promise<void> {
  const addr = email.trim().toLowerCase();
  if (!hasDb()) {
    const e = MEM.find((w) => w.email === addr);
    if (e) {
      e.status = "invited";
      e.inviteCode = code;
    }
    return;
  }
  await sql()`
    UPDATE waitlist SET status = 'invited', invite_code = ${code}
    WHERE lower(email) = ${addr}
  `;
}

export async function setWaitlistStatus(
  email: string,
  status: "new" | "invited" | "declined",
): Promise<void> {
  const addr = email.trim().toLowerCase();
  if (!hasDb()) {
    const e = MEM.find((w) => w.email === addr);
    if (e) e.status = status;
    return;
  }
  await sql()`UPDATE waitlist SET status = ${status} WHERE lower(email) = ${addr}`;
}
