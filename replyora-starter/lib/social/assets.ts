import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";

/**
 * ReplyOra Social — media assets (the `assets` table). Workspace-scoped, and
 * optionally client-scoped (client_id NULL = the agency's shared library).
 * Files live in R2 (lib/social/storage.ts); rows here hold the public URL.
 *
 * DATABASE_URL set → Neon; unset → in-memory (local dev).
 */

export type AssetKind = "image" | "video";
export type AssetOwner = "agency" | "client";

export interface Asset {
  id: string;
  clientId: string | null;
  url: string;
  kind: AssetKind;
  folder: string | null;
  uploadedBy: AssetOwner;
  createdAt: string;
}

export interface NewAsset {
  clientId?: string | null;
  url: string;
  kind: AssetKind;
  folder?: string | null;
  uploadedBy?: AssetOwner;
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

function genId(): string {
  return "as_" + Math.random().toString(36).slice(2, 10);
}

interface MemAsset extends Asset {
  workspaceId: string;
}
const MEM: MemAsset[] = [];

interface Row {
  id: string;
  client_id: string | null;
  url: string;
  kind: string;
  folder: string | null;
  uploaded_by: string;
  created_at: string | Date;
}

function toAsset(r: Row): Asset {
  return {
    id: r.id,
    clientId: r.client_id,
    url: r.url,
    kind: (r.kind as AssetKind) ?? "image",
    folder: r.folder,
    uploadedBy: (r.uploaded_by as AssetOwner) ?? "agency",
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function listClientAssets(clientId: string): Promise<Asset[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    return MEM.filter(
      (a) => a.workspaceId === workspaceId && a.clientId === clientId,
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const rows = (await sql()`
    SELECT id, client_id, url, kind, folder, uploaded_by, created_at
    FROM assets
    WHERE workspace_id = ${workspaceId} AND client_id = ${clientId}
    ORDER BY created_at DESC
  `) as Row[];
  return rows.map(toAsset);
}

export async function listWorkspaceAssets(): Promise<Asset[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    return MEM.filter((a) => a.workspaceId === workspaceId).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
  const rows = (await sql()`
    SELECT id, client_id, url, kind, folder, uploaded_by, created_at
    FROM assets
    WHERE workspace_id = ${workspaceId}
    ORDER BY created_at DESC
  `) as Row[];
  return rows.map(toAsset);
}

export async function createAsset(input: NewAsset): Promise<Asset> {
  const workspaceId = await getCurrentWorkspaceId();
  return createAssetForWorkspace(workspaceId, input);
}

/**
 * Create an asset for an EXPLICIT workspace (no session) — used by the phone
 * upload flow, where the workspace comes from a signed token, not a login.
 */
export async function createAssetForWorkspace(
  workspaceId: string,
  input: NewAsset,
): Promise<Asset> {
  const asset: Asset = {
    id: genId(),
    clientId: input.clientId ?? null,
    url: input.url,
    kind: input.kind,
    folder: input.folder ?? null,
    uploadedBy: input.uploadedBy ?? "agency",
    createdAt: new Date().toISOString(),
  };
  if (!hasDb()) {
    MEM.push({ ...asset, workspaceId });
    return asset;
  }
  await sql()`
    INSERT INTO assets
      (id, workspace_id, client_id, url, kind, folder, uploaded_by, created_at)
    VALUES
      (${asset.id}, ${workspaceId}, ${asset.clientId}, ${asset.url},
       ${asset.kind}, ${asset.folder}, ${asset.uploadedBy}, ${asset.createdAt})
  `;
  return asset;
}

export async function deleteAsset(id: string): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const i = MEM.findIndex(
      (a) => a.id === id && a.workspaceId === workspaceId,
    );
    if (i >= 0) MEM.splice(i, 1);
    return;
  }
  await sql()`
    DELETE FROM assets WHERE workspace_id = ${workspaceId} AND id = ${id}
  `;
}
