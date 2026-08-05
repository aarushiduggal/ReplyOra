import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { DEMO_CLIENT } from "@/lib/social/demo";

/**
 * ReplyOra Social — clients data layer (the brands an agency manages).
 *
 * Same two-backend seam as posts (lib/social/store.ts):
 *   • DATABASE_URL set   → Neon (Postgres). Schema: db/migrations/0003_agency_clients.sql
 *   • DATABASE_URL unset → in-memory (local dev / demo).
 *
 * Every read/write is scoped by the agency's Auth.js workspace_id, resolved
 * server-side from the session — never trusted from the client.
 */

export interface Client {
  id: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  platforms: string[];
  pillarCount: number;
  createdAt: string;
}

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

interface Row {
  id: string;
  name: string;
  handle: string | null;
  avatar_url: string | null;
  platforms: string[] | null;
  pillar_count: number | string | null;
  created_at: string | Date;
}

function toClient(r: Row): Client {
  return {
    id: r.id,
    name: r.name,
    handle: r.handle,
    avatarUrl: r.avatar_url,
    platforms: r.platforms ?? [],
    pillarCount: Number(r.pillar_count ?? 0),
    createdAt: new Date(r.created_at).toISOString(),
  };
}

// ---- In-memory fallback (local dev, no DB configured) --------------------
interface MemClient extends Client {
  workspaceId: string;
}
// Seeded with one fully-populated demo brand so mock/local mode never looks
// empty and every screen shows a real client name (see lib/social/demo.ts).
const CLIENTS: MemClient[] = [DEMO_CLIENT];

function stripWs(c: MemClient): Client {
  return {
    id: c.id,
    name: c.name,
    handle: c.handle,
    avatarUrl: c.avatarUrl,
    platforms: c.platforms,
    pillarCount: c.pillarCount,
    createdAt: c.createdAt,
  };
}

function genId(): string {
  return "cl_" + Math.random().toString(36).slice(2, 10);
}

// ---- Public interface ----------------------------------------------------

export async function listClients(): Promise<Client[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    return CLIENTS.filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(stripWs);
  }
  const rows = (await sql()`
    SELECT c.id, c.name, c.handle, c.avatar_url, c.platforms,
           COUNT(p.id) AS pillar_count, c.created_at
    FROM clients c
    LEFT JOIN pillars p ON p.client_id = c.id
    WHERE c.workspace_id = ${workspaceId}
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `) as Row[];
  return rows.map(toClient);
}

export async function getClient(id: string): Promise<Client | null> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const c = CLIENTS.find((x) => x.id === id && x.workspaceId === workspaceId);
    return c ? stripWs(c) : null;
  }
  const rows = (await sql()`
    SELECT c.id, c.name, c.handle, c.avatar_url, c.platforms,
           COUNT(p.id) AS pillar_count, c.created_at
    FROM clients c
    LEFT JOIN pillars p ON p.client_id = c.id
    WHERE c.workspace_id = ${workspaceId} AND c.id = ${id}
    GROUP BY c.id
    LIMIT 1
  `) as Row[];
  const row = rows[0];
  return row ? toClient(row) : null;
}

/**
 * Connect/disconnect a platform for a client (stored in clients.platforms).
 * OAuth stub: records the connection; real token exchange is wired later.
 */
export async function setClientPlatform(
  clientId: string,
  platform: string,
  connected: boolean,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const c = CLIENTS.find(
      (x) => x.id === clientId && x.workspaceId === workspaceId,
    );
    if (c) {
      const set = new Set(c.platforms);
      if (connected) set.add(platform);
      else set.delete(platform);
      c.platforms = Array.from(set);
    }
    return;
  }
  if (connected) {
    await sql()`
      UPDATE clients
      SET platforms = (
        SELECT ARRAY(SELECT DISTINCT unnest(array_append(platforms, ${platform})))
      )
      WHERE id = ${clientId} AND workspace_id = ${workspaceId}
    `;
  } else {
    await sql()`
      UPDATE clients
      SET platforms = array_remove(platforms, ${platform})
      WHERE id = ${clientId} AND workspace_id = ${workspaceId}
    `;
  }
}

export async function addClient(name: string): Promise<Client> {
  const workspaceId = await getCurrentWorkspaceId();
  const clean = name.trim() || "New client";
  const id = genId();
  const createdAt = new Date().toISOString();

  if (!hasDb()) {
    const c: MemClient = {
      id,
      workspaceId,
      name: clean,
      handle: null,
      avatarUrl: null,
      platforms: [],
      pillarCount: 0,
      createdAt,
    };
    CLIENTS.push(c);
    return stripWs(c);
  }

  await sql()`
    INSERT INTO clients (id, workspace_id, name, created_at)
    VALUES (${id}, ${workspaceId}, ${clean}, ${createdAt})
  `;
  return {
    id,
    name: clean,
    handle: null,
    avatarUrl: null,
    platforms: [],
    pillarCount: 0,
    createdAt,
  };
}
