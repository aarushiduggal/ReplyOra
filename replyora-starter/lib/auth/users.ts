import "server-only";

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

/**
 * Auth.js user + workspace store on Neon (Milestone 2).
 *
 * Used only when Auth.js is the active auth backend (USE_AUTHJS) — i.e. on the
 * Netlify/Neon deployment. Schema: db/migrations/0002_auth.sql.
 */

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string | null;
  image: string | null;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  name: string | null;
  image: string | null;
}

function toUser(r: UserRow): DbUser {
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.password_hash,
    name: r.name,
    image: r.image,
  };
}

const newId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

/** Look up a user by email (case-insensitive). */
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const rows = (await sql()`
    SELECT id, email, password_hash, name, image
    FROM users WHERE lower(email) = lower(${email}) LIMIT 1
  `) as UserRow[];
  return rows[0] ? toUser(rows[0]) : null;
}

/** Create an email+password user. Caller must ensure the email is free. */
export async function createUser(input: {
  email: string;
  password: string;
  name: string | null;
}): Promise<DbUser> {
  const id = newId("usr");
  const hash = await bcrypt.hash(input.password, 10);
  const email = input.email.trim();
  await sql()`
    INSERT INTO users (id, email, password_hash, name)
    VALUES (${id}, ${email}, ${hash}, ${input.name})
  `;
  return { id, email, passwordHash: hash, name: input.name, image: null };
}

/** Verify a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Ensure a Google (OAuth) user has a row; create it on first sign-in. Returns
 * the canonical user id so it matches the Credentials path.
 */
export async function upsertOAuthUser(input: {
  email: string;
  name: string | null;
  image: string | null;
}): Promise<DbUser> {
  const existing = await getUserByEmail(input.email);
  if (existing) return existing;
  const id = newId("usr");
  await sql()`
    INSERT INTO users (id, email, name, image)
    VALUES (${id}, ${input.email.trim()}, ${input.name}, ${input.image})
  `;
  return {
    id,
    email: input.email,
    passwordHash: null,
    name: input.name,
    image: input.image,
  };
}

/** The user's workspace id, creating a personal workspace on first use. */
export async function getOrCreateWorkspace(
  userId: string,
  displayName: string,
): Promise<string> {
  const rows = (await sql()`
    SELECT id FROM workspaces WHERE owner_id = ${userId}
    ORDER BY created_at ASC LIMIT 1
  `) as { id: string }[];
  if (rows[0]) return rows[0].id;

  const id = newId("ws");
  const first = displayName.trim().split(/\s+/)[0] || "My";
  const name = `${first}'s workspace`;
  await sql()`
    INSERT INTO workspaces (id, owner_id, name)
    VALUES (${id}, ${userId}, ${name})
  `;
  return id;
}
