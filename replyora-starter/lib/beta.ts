import "server-only";

import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

/**
 * Closed beta — invite-only access, a public waitlist, and a 30-day free window.
 *
 * Schema: db/migrations/0014_beta_access.sql
 *
 * Two doors lead into the product and BOTH are gated here:
 *   1. /api/auth/register  (email + password)
 *   2. the Google signIn callback in auth.ts
 * Gating only the first would be theatre — anyone with a Gmail could click
 * "Continue with Google" and land straight in the dashboard.
 *
 * Without DATABASE_URL (local dev) the beta is OPEN, so `npm run dev` never
 * needs an invite. The gate is a production concern.
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

/** How long a redeemed invite grants full free access. */
export const BETA_DAYS = 30;

/**
 * Master switch. The beta gate is ON by default in production — a deploy that
 * forgets an env var must fail CLOSED, not throw the doors open. Set
 * BETA_OPEN_SIGNUP=1 to reopen public signup when the beta ends.
 */
export function betaGateOn(): boolean {
  if (!hasDb()) return false; // local dev: never gate
  return process.env.BETA_OPEN_SIGNUP !== "1";
}

// ── Invite codes ───────────────────────────────────────────────────────────

/**
 * Unambiguous alphabet: no O/0, I/l/1. These codes get read off a phone screen
 * and retyped, and "was that an O or a zero?" turns into a support message.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function makeCode(len = 10): string {
  // rejection-free: 54 chars doesn't divide 256 evenly, but the bias is tiny
  // and these are lookup keys, not secrets protecting money.
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

export interface BetaInvite {
  code: string;
  label: string | null;
  email: string | null;
  createdAt: string;
  usedAt: string | null;
  usedByEmail: string | null;
  revokedAt: string | null;
}

function iso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
  return String(v);
}

interface InviteRow {
  code: string;
  label: string | null;
  email: string | null;
  created_at: string | Date;
  used_at: string | Date | null;
  used_by_email: string | null;
  revoked_at: string | Date | null;
}

function toInvite(r: InviteRow): BetaInvite {
  return {
    code: r.code,
    label: r.label,
    email: r.email,
    createdAt: iso(r.created_at) ?? "",
    usedAt: iso(r.used_at),
    usedByEmail: r.used_by_email,
    revokedAt: iso(r.revoked_at),
  };
}

/** Mint one invite. `label` is your note about who it's for. */
export async function createInvite(input: {
  label?: string | null;
  email?: string | null;
  createdBy?: string | null;
}): Promise<BetaInvite> {
  const code = makeCode();
  const email = input.email?.trim().toLowerCase() || null;
  const rows = (await sql()`
    INSERT INTO beta_invites (code, label, email, created_by)
    VALUES (${code}, ${input.label?.trim() || null}, ${email}, ${input.createdBy ?? null})
    RETURNING code, label, email, created_at, used_at, used_by_email, revoked_at
  `) as InviteRow[];
  return toInvite(rows[0]!);
}

/** Mint several at once — for when a batch of DMs all land the same day. */
export async function createInvites(
  count: number,
  createdBy?: string | null,
): Promise<BetaInvite[]> {
  const n = Math.max(1, Math.min(50, Math.floor(count)));
  const out: BetaInvite[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push(await createInvite({ createdBy }));
  }
  return out;
}

export async function listInvites(): Promise<BetaInvite[]> {
  if (!hasDb()) return [];
  try {
    const rows = (await sql()`
      SELECT code, label, email, created_at, used_at, used_by_email, revoked_at
      FROM beta_invites ORDER BY created_at DESC LIMIT 500
    `) as InviteRow[];
    return rows.map(toInvite);
  } catch (err) {
    console.error("[beta] listInvites failed", err);
    return [];
  }
}

export async function revokeInvite(code: string): Promise<void> {
  await sql()`UPDATE beta_invites SET revoked_at = now() WHERE code = ${code} AND used_at IS NULL`;
}

export type InviteCheck =
  | { ok: true; invite: BetaInvite }
  | { ok: false; reason: "unknown" | "used" | "revoked" | "wrong-email" };

/**
 * Is this code good? Read-only — call `redeemInvite` to actually consume it.
 * `email` is checked only for invites locked to one address.
 */
export async function checkInvite(
  code: string,
  email?: string | null,
): Promise<InviteCheck> {
  const clean = code.trim();
  if (!clean) return { ok: false, reason: "unknown" };
  const rows = (await sql()`
    SELECT code, label, email, created_at, used_at, used_by_email, revoked_at
    FROM beta_invites WHERE code = ${clean} LIMIT 1
  `) as InviteRow[];
  const row = rows[0];
  if (!row) return { ok: false, reason: "unknown" };
  if (row.revoked_at) return { ok: false, reason: "revoked" };
  if (row.used_at) return { ok: false, reason: "used" };
  if (row.email && email && row.email !== email.trim().toLowerCase()) {
    return { ok: false, reason: "wrong-email" };
  }
  return { ok: true, invite: toInvite(row) };
}

/**
 * Consume an invite for this email and open the 30-day window.
 *
 * The UPDATE carries its own `used_at IS NULL` guard so two people clicking the
 * same link at once can't both get in — Postgres settles it, not us.
 */
export async function redeemInvite(
  code: string,
  email: string,
  userId?: string | null,
): Promise<boolean> {
  const clean = code.trim();
  const addr = email.trim().toLowerCase();
  if (!clean || !addr) return false;
  const rows = (await sql()`
    UPDATE beta_invites
       SET used_at = now(), used_by_email = ${addr}, used_by_user = ${userId ?? null}
     WHERE code = ${clean}
       AND used_at IS NULL
       AND revoked_at IS NULL
       AND (email IS NULL OR email = ${addr})
    RETURNING code
  `) as { code: string }[];
  if (rows.length === 0) return false;

  // Open the free window and mark the waitlist row, both best-effort: the
  // invite is already spent, so failing here must not lock the person out.
  try {
    await sql()`
      UPDATE users
         SET beta_expires_at = now() + (${BETA_DAYS} || ' days')::interval,
             beta_invite_code = ${clean}
       WHERE lower(email) = ${addr}
    `;
  } catch (err) {
    console.error("[beta] could not stamp the beta window", err);
  }
  try {
    await sql()`UPDATE waitlist SET status = 'invited' WHERE lower(email) = ${addr}`;
  } catch {
    /* they may never have been on the waitlist — fine */
  }
  return true;
}

// ── Who may sign up ────────────────────────────────────────────────────────

/**
 * May this email create an account right now?
 *
 * Returns true when the beta is open, the person already has an account (never
 * lock out an existing user), or they hold an unused invite.
 */
export async function mayCreateAccount(
  email: string,
  code?: string | null,
): Promise<boolean> {
  if (!betaGateOn()) return true;
  const addr = email.trim().toLowerCase();
  if (!addr) return false;

  try {
    const existing = (await sql()`
      SELECT 1 FROM users WHERE lower(email) = ${addr} LIMIT 1
    `) as unknown[];
    if (existing.length > 0) return true;
  } catch (err) {
    // Fail CLOSED. If we can't tell, refusing costs one support message;
    // allowing throws the beta open to the public.
    console.error("[beta] existing-user lookup failed — refusing signup", err);
    return false;
  }

  if (!code) return false;
  try {
    const check = await checkInvite(code, addr);
    return check.ok;
  } catch (err) {
    console.error("[beta] invite check failed — refusing signup", err);
    return false;
  }
}

// ── The 30-day window ──────────────────────────────────────────────────────

export interface BetaWindow {
  /** They're a beta account (whether or not it's still running). */
  isBeta: boolean;
  /** Still inside the free 30 days. */
  active: boolean;
  expiresAt: string | null;
  daysLeft: number;
}

const NOT_BETA: BetaWindow = {
  isBeta: false,
  active: false,
  expiresAt: null,
  daysLeft: 0,
};

/** Where this email sits in the beta window. Never throws. */
export async function betaWindowFor(
  email: string | null | undefined,
): Promise<BetaWindow> {
  if (!email || !hasDb()) return NOT_BETA;
  try {
    const rows = (await sql()`
      SELECT beta_expires_at FROM users WHERE lower(email) = ${email.trim().toLowerCase()} LIMIT 1
    `) as { beta_expires_at: string | Date | null }[];
    const raw = rows[0]?.beta_expires_at;
    if (!raw) return NOT_BETA;
    const expires = raw instanceof Date ? raw : new Date(String(raw));
    if (Number.isNaN(expires.getTime())) return NOT_BETA;
    const ms = expires.getTime() - Date.now();
    return {
      isBeta: true,
      active: ms > 0,
      expiresAt: expires.toISOString(),
      daysLeft: Math.max(0, Math.ceil(ms / 86_400_000)),
    };
  } catch (err) {
    console.error("[beta] betaWindowFor failed", err);
    return NOT_BETA;
  }
}
