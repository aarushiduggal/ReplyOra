import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { makeShareToken } from "@/lib/social/portal";

/**
 * Extended client-management data (brand kit, brief, features, billing, pillars,
 * portal invites). Columns/tables from db/migrations/0008_client_management.sql.
 *
 * Every read is RESILIENT: if the migration hasn't been run yet, the queries
 * fall back to sensible defaults instead of throwing, so the live site never
 * breaks. Writes require the migration to be applied.
 */

export interface BrandColor {
  label: string;
  hex: string;
}
export interface ClientFeatures {
  planner: boolean;
  month: boolean;
  spreadsheet: boolean;
  approvals: boolean;
  gridSuggestion: boolean;
  /**
   * AI website chatbox live for THIS client's site. Billed at $39/mo AUD per
   * enabled client (Agency includes the first one free). Off by default.
   */
  chatboxEnabled: boolean;
}
export interface ClientBilling {
  billToName: string;
  billToEmail: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  paymentTerms: string;
  taxRate: string;
  currency: string;
  paymentDetails: string;
}
export interface Pillar {
  id: string;
  name: string;
  colour: string | null;
}
export interface ClientInvite {
  id: string;
  recipient: string | null;
  email: string | null;
  role: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
}
export interface BriefPdf {
  id: string;
  title: string;
  url: string | null;
  kind: "brief" | "contract";
  createdAt: string;
}

export interface ClientDetail {
  id: string;
  name: string;
  brandVoice: string;
  packagePlan: string;
  startedOn: string | null;
  packageDeliverables: string;
  privateNotes: string;
  platforms: string[];
  logoUrl: string | null;
  brandColors: BrandColor[];
  fontDisplay: string;
  fontBody: string;
  briefNotes: string;
  features: ClientFeatures;
  billing: ClientBilling;
  pillars: Pillar[];
  invites: ClientInvite[];
  briefPdfs: BriefPdf[];
}

const DEFAULT_FEATURES: ClientFeatures = {
  planner: true,
  month: true,
  spreadsheet: true,
  approvals: true,
  gridSuggestion: false,
  chatboxEnabled: false,
};
const EMPTY_BILLING: ClientBilling = {
  billToName: "",
  billToEmail: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  paymentTerms: "",
  taxRate: "",
  currency: "",
  paymentDetails: "",
};

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

function genId(p: string): string {
  return `${p}_` + Math.random().toString(36).slice(2, 10);
}

// In-memory store for local/mock mode (keyed by clientId).
const MEM = new Map<string, Partial<ClientDetail>>();

function base(id: string, name: string): ClientDetail {
  return {
    id,
    name,
    brandVoice: "",
    packagePlan: "",
    startedOn: null,
    packageDeliverables: "",
    privateNotes: "",
    platforms: [],
    logoUrl: null,
    brandColors: [],
    fontDisplay: "",
    fontBody: "",
    briefNotes: "",
    features: { ...DEFAULT_FEATURES },
    billing: { ...EMPTY_BILLING },
    pillars: [],
    invites: [],
    briefPdfs: [],
  };
}

/** Full client-management detail. Degrades to defaults if 0008 isn't applied. */
export async function getClientDetail(id: string): Promise<ClientDetail | null> {
  const workspaceId = await getCurrentWorkspaceId();

  if (!hasDb()) {
    const mem = MEM.get(id) ?? {};
    return { ...base(id, (mem.name as string) ?? "Client"), ...mem, id };
  }

  // Base row (always exists).
  const baseRows = (await sql()`
    SELECT id, name, platforms, package_deliverables, private_notes
    FROM clients WHERE id = ${id} AND workspace_id = ${workspaceId} LIMIT 1
  `) as {
    id: string;
    name: string;
    platforms: string[] | null;
    package_deliverables: string | null;
    private_notes: string | null;
  }[];
  const b = baseRows[0];
  if (!b) return null;

  const detail = base(id, b.name);
  detail.platforms = b.platforms ?? [];
  detail.packageDeliverables = b.package_deliverables ?? "";
  detail.privateNotes = b.private_notes ?? "";

  // The extended-column, pillars, invites and PDF reads are independent of one
  // another — run them concurrently so we pay one round-trip, not four.
  await Promise.all([
  // Extended columns — resilient (may not exist before 0008 runs).
  (async () => {
  try {
    const rows = (await sql()`
      SELECT brand_voice, package_plan, started_on, logo_url, brand_colors,
             font_display, font_body, brief_notes, features, billing
      FROM clients WHERE id = ${id} AND workspace_id = ${workspaceId} LIMIT 1
    `) as Record<string, unknown>[];
    const r = rows[0];
    if (r) {
      detail.brandVoice = (r.brand_voice as string) ?? "";
      detail.packagePlan = (r.package_plan as string) ?? "";
      detail.startedOn = r.started_on
        ? new Date(r.started_on as string).toISOString().slice(0, 10)
        : null;
      detail.logoUrl = (r.logo_url as string) ?? null;
      detail.brandColors = Array.isArray(r.brand_colors)
        ? (r.brand_colors as BrandColor[])
        : [];
      detail.fontDisplay = (r.font_display as string) ?? "";
      detail.fontBody = (r.font_body as string) ?? "";
      detail.briefNotes = (r.brief_notes as string) ?? "";
      detail.features = { ...DEFAULT_FEATURES, ...((r.features as object) ?? {}) };
      detail.billing = { ...EMPTY_BILLING, ...((r.billing as object) ?? {}) };
    }
  } catch {
    /* 0008 not applied yet — keep defaults */
  }
  })(),

  // Pillars (table exists from 0003).
  (async () => {
  try {
    const p = (await sql()`
      SELECT id, name, colour FROM pillars WHERE client_id = ${id} ORDER BY name
    `) as Pillar[];
    detail.pillars = p;
  } catch {
    /* ignore */
  }
  })(),

  // Invites (table from 0008).
  (async () => {
  try {
    const inv = (await sql()`
      SELECT id, recipient, email, role, token, expires_at, created_at
      FROM client_invites WHERE client_id = ${id} AND workspace_id = ${workspaceId}
      ORDER BY created_at DESC
    `) as {
      id: string;
      recipient: string | null;
      email: string | null;
      role: string;
      token: string;
      expires_at: string | Date | null;
      created_at: string | Date;
    }[];
    detail.invites = inv.map((x) => ({
      id: x.id,
      recipient: x.recipient,
      email: x.email,
      role: x.role,
      token: x.token,
      expiresAt: x.expires_at ? new Date(x.expires_at).toISOString() : null,
      createdAt: new Date(x.created_at).toISOString(),
    }));
  } catch {
    /* 0008 not applied yet */
  }

  // Brand-brief PDFs (knowledge_sources, type = 'pdf').
  try {
    const pdfs = (await sql()`
      SELECT id, title, url, type, created_at FROM knowledge_sources
      WHERE client_id = ${id} AND type IN ('pdf', 'contract') ORDER BY created_at DESC
    `) as { id: string; title: string | null; url: string | null; type: string | null; created_at: string | Date }[];
    detail.briefPdfs = pdfs.map((p) => ({
      id: p.id,
      title: p.title ?? "Document",
      url: p.url,
      kind: p.type === "contract" ? "contract" : "brief",
      createdAt: new Date(p.created_at).toISOString(),
    }));
  } catch {
    /* url column / table not present yet */
  }
  })(),
  ]);

  return detail;
}

/** Record an uploaded brand-brief PDF (stored in R2, referenced here). */
export async function addBriefPdf(
  clientId: string,
  input: { title: string; url: string; kind?: "brief" | "contract" },
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return;
  const owns = (await sql()`
    SELECT 1 FROM clients WHERE id = ${clientId} AND workspace_id = ${workspaceId} LIMIT 1
  `) as unknown[];
  if (owns.length === 0) return;
  const type = input.kind === "contract" ? "contract" : "pdf";
  try {
    await sql()`
      INSERT INTO knowledge_sources (id, client_id, type, title, url, status)
      VALUES (${genId("kn")}, ${clientId}, ${type}, ${input.title}, ${input.url}, 'ready')
    `;
  } catch {
    /* url column missing (0008 not applied) */
  }
}

export type ClientDetailPatch = Partial<
  Pick<
    ClientDetail,
    | "name"
    | "brandVoice"
    | "packagePlan"
    | "startedOn"
    | "packageDeliverables"
    | "privateNotes"
    | "platforms"
    | "logoUrl"
    | "brandColors"
    | "fontDisplay"
    | "fontBody"
    | "briefNotes"
    | "features"
    | "billing"
  >
>;

/** Update any subset of the client's management fields. */
export async function updateClientDetail(
  id: string,
  patch: ClientDetailPatch,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    MEM.set(id, { ...(MEM.get(id) ?? {}), ...patch });
    return;
  }

  // Base columns (always present).
  if (patch.name !== undefined)
    await sql()`UPDATE clients SET name = ${patch.name} WHERE id = ${id} AND workspace_id = ${workspaceId}`;
  if (patch.platforms !== undefined)
    await sql()`UPDATE clients SET platforms = ${patch.platforms} WHERE id = ${id} AND workspace_id = ${workspaceId}`;
  if (patch.packageDeliverables !== undefined)
    await sql()`UPDATE clients SET package_deliverables = ${patch.packageDeliverables} WHERE id = ${id} AND workspace_id = ${workspaceId}`;
  if (patch.privateNotes !== undefined)
    await sql()`UPDATE clients SET private_notes = ${patch.privateNotes} WHERE id = ${id} AND workspace_id = ${workspaceId}`;

  // Extended columns — each in its own try so a pre-migration DB never 500s.
  const set = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch {
      /* column missing (0008 not applied) — skip */
    }
  };
  if (patch.brandVoice !== undefined)
    await set(() => sql()`UPDATE clients SET brand_voice = ${patch.brandVoice!} WHERE id = ${id} AND workspace_id = ${workspaceId}`);
  if (patch.packagePlan !== undefined)
    await set(() => sql()`UPDATE clients SET package_plan = ${patch.packagePlan!} WHERE id = ${id} AND workspace_id = ${workspaceId}`);
  if (patch.startedOn !== undefined)
    await set(() => sql()`UPDATE clients SET started_on = ${patch.startedOn || null} WHERE id = ${id} AND workspace_id = ${workspaceId}`);
  if (patch.logoUrl !== undefined)
    await set(() => sql()`UPDATE clients SET logo_url = ${patch.logoUrl} WHERE id = ${id} AND workspace_id = ${workspaceId}`);
  if (patch.brandColors !== undefined)
    await set(() => sql()`UPDATE clients SET brand_colors = ${JSON.stringify(patch.brandColors)} WHERE id = ${id} AND workspace_id = ${workspaceId}`);
  if (patch.fontDisplay !== undefined)
    await set(() => sql()`UPDATE clients SET font_display = ${patch.fontDisplay!} WHERE id = ${id} AND workspace_id = ${workspaceId}`);
  if (patch.fontBody !== undefined)
    await set(() => sql()`UPDATE clients SET font_body = ${patch.fontBody!} WHERE id = ${id} AND workspace_id = ${workspaceId}`);
  if (patch.briefNotes !== undefined)
    await set(() => sql()`UPDATE clients SET brief_notes = ${patch.briefNotes!} WHERE id = ${id} AND workspace_id = ${workspaceId}`);
  if (patch.features !== undefined)
    await set(() => sql()`UPDATE clients SET features = ${JSON.stringify(patch.features)} WHERE id = ${id} AND workspace_id = ${workspaceId}`);
  if (patch.billing !== undefined)
    await set(() => sql()`UPDATE clients SET billing = ${JSON.stringify(patch.billing)} WHERE id = ${id} AND workspace_id = ${workspaceId}`);
}

// Mock/demo mode has no durable store (module memory doesn't survive between
// dev requests), so the set of chatbox-enabled clients lives in a cookie —
// mirrors the add-ons cookie in lib/social/billing.ts.
const CHATBOX_CLIENTS_COOKIE = "ro_chatbox_clients";

async function readMockChatboxSet(): Promise<Set<string>> {
  try {
    const raw = (await cookies()).get(CHATBOX_CLIENTS_COOKIE)?.value;
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? (arr as string[]) : []);
  } catch {
    return new Set();
  }
}

async function writeMockChatboxSet(set: Set<string>): Promise<void> {
  try {
    (await cookies()).set(CHATBOX_CLIENTS_COOKIE, JSON.stringify([...set]), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  } catch {
    /* not a writable (action/route) context — ignore */
  }
}

/** Is THIS client's website chatbox switched on? */
export async function isClientChatboxEnabled(clientId: string): Promise<boolean> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return (await readMockChatboxSet()).has(clientId);
  try {
    const rows = (await sql()`
      SELECT COALESCE((features->>'chatboxEnabled')::boolean, false) AS on
      FROM clients WHERE id = ${clientId} AND workspace_id = ${workspaceId} LIMIT 1
    `) as { on: boolean }[];
    return rows[0]?.on ?? false;
  } catch {
    return false; // 0008 not applied yet
  }
}

/** How many clients in the workspace have the chatbox switched on (billing). */
export async function countChatboxEnabledClients(workspaceId: string): Promise<number> {
  if (!hasDb()) return (await readMockChatboxSet()).size;
  try {
    const rows = (await sql()`
      SELECT count(*)::int AS n FROM clients
      WHERE workspace_id = ${workspaceId}
        AND COALESCE((features->>'chatboxEnabled')::boolean, false) = true
    `) as { n: number }[];
    return rows[0]?.n ?? 0;
  } catch {
    return 0; // 0008 not applied yet
  }
}

/** Turn THIS client's website chatbox on/off (per-site feature flag, JSONB merge). */
export async function setClientChatbox(clientId: string, enabled: boolean): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const set = await readMockChatboxSet();
    if (enabled) set.add(clientId);
    else set.delete(clientId);
    await writeMockChatboxSet(set);
    return;
  }
  // Merge into the existing features JSONB so other flags aren't clobbered.
  await sql()`
    UPDATE clients
    SET features = COALESCE(features, '{}'::jsonb) || ${JSON.stringify({ chatboxEnabled: enabled })}::jsonb
    WHERE id = ${clientId} AND workspace_id = ${workspaceId}
  `;
}

/** Replace the client's content pillars. */
export async function savePillars(
  clientId: string,
  pillars: { name: string; colour?: string | null }[],
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const mem = MEM.get(clientId) ?? {};
    MEM.set(clientId, {
      ...mem,
      pillars: pillars
        .filter((p) => p.name.trim())
        .map((p) => ({ id: genId("pil"), name: p.name.trim(), colour: p.colour ?? null })),
    });
    return;
  }
  // Ownership check.
  const owns = (await sql()`
    SELECT 1 FROM clients WHERE id = ${clientId} AND workspace_id = ${workspaceId} LIMIT 1
  `) as unknown[];
  if (owns.length === 0) return;
  await sql()`DELETE FROM pillars WHERE client_id = ${clientId}`;
  for (const p of pillars) {
    const name = p.name.trim();
    if (!name) continue;
    await sql()`
      INSERT INTO pillars (id, client_id, name, colour)
      VALUES (${genId("pil")}, ${clientId}, ${name}, ${p.colour ?? null})
    `;
  }
}

/** Create a client-portal invite; returns the shareable link path. */
export async function createInvite(
  clientId: string,
  input: { recipient?: string; email?: string; role?: string; expiresDays?: number },
): Promise<{ token: string } | null> {
  const workspaceId = await getCurrentWorkspaceId();
  // The link IS the working portal share token (HMAC of the client id), so the
  // invite opens the real /portal/[token] page with no extra landing page.
  const token = makeShareToken(clientId);
  const expiresAt = input.expiresDays
    ? new Date(Date.now() + input.expiresDays * 86_400_000).toISOString()
    : null;
  if (!hasDb()) {
    const mem = MEM.get(clientId) ?? {};
    const invites = (mem.invites as ClientInvite[]) ?? [];
    invites.unshift({
      id: genId("inv"),
      recipient: input.recipient ?? null,
      email: input.email ?? null,
      role: input.role ?? "client",
      token,
      expiresAt,
      createdAt: new Date().toISOString(),
    });
    MEM.set(clientId, { ...mem, invites });
    return { token };
  }
  try {
    await sql()`
      INSERT INTO client_invites
        (id, workspace_id, client_id, recipient, email, role, token, expires_at)
      VALUES
        (${genId("inv")}, ${workspaceId}, ${clientId}, ${input.recipient ?? null},
         ${input.email ?? null}, ${input.role ?? "client"}, ${token}, ${expiresAt})
    `;
    return { token };
  } catch {
    return null; // 0008 not applied
  }
}
