import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";

/**
 * ReplyOra Social — per-client website chatbox (the AI assistant that lives on
 * the client's own site). Neon tables: assistants, knowledge_sources.
 *
 * This is the WEBSITE chatbox — not Instagram DMs. Every call is scoped by the
 * agency workspace_id (join through clients) AND client_id.
 */

export interface ClientAssistant {
  id: string;
  clientId: string;
  name: string;
  tone: string;
  brandColour: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
  leadFields: string[];
  publicKey: string;
  enabled: boolean;
}

export interface KnowledgeSource {
  id: string;
  clientId: string;
  type: string;
  title: string;
  preview: string;
  status: string;
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

function genKey(): string {
  return "rk_" + Math.random().toString(36).slice(2, 12);
}
function genId(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}

const DEFAULTS = (clientName: string): Omit<ClientAssistant, "id" | "clientId" | "publicKey"> => ({
  name: `${clientName} Assistant`,
  tone: "Friendly & professional",
  brandColour: "#5C1A1A",
  welcomeMessage: `Hi! 👋 How can we help you today?`,
  suggestedQuestions: ["What are your prices?", "What are your hours?", "Can I book in?"],
  leadFields: ["Name", "Email", "Phone"],
  enabled: true,
});

// ---- In-memory fallback --------------------------------------------------
const MEM_ASSISTANT = new Map<string, ClientAssistant>(); // key: `${ws}:${client}`
const MEM_KNOWLEDGE: (KnowledgeSource & { ws: string })[] = [];

async function ownsClient(workspaceId: string, clientId: string): Promise<boolean> {
  if (!hasDb()) return true;
  const rows = (await sql()`
    SELECT 1 FROM clients WHERE id = ${clientId} AND workspace_id = ${workspaceId} LIMIT 1
  `) as unknown[];
  return rows.length > 0;
}

interface AsstRow {
  id: string;
  client_id: string;
  name: string | null;
  tone: string | null;
  brand_colour: string | null;
  welcome_message: string | null;
  suggested_questions: string[] | null;
  lead_fields: string[] | null;
  public_key: string | null;
  enabled: boolean;
}

function toAssistant(r: AsstRow): ClientAssistant {
  return {
    id: r.id,
    clientId: r.client_id,
    name: r.name ?? "",
    tone: r.tone ?? "",
    brandColour: r.brand_colour ?? "#5C1A1A",
    welcomeMessage: r.welcome_message ?? "",
    suggestedQuestions: r.suggested_questions ?? [],
    leadFields: r.lead_fields ?? [],
    publicKey: r.public_key ?? "",
    enabled: r.enabled ?? true,
  };
}

export async function getOrCreateClientAssistant(
  clientId: string,
  clientName: string,
): Promise<ClientAssistant> {
  const workspaceId = await getCurrentWorkspaceId();
  const memKey = `${workspaceId}:${clientId}`;

  if (!hasDb()) {
    const existing = MEM_ASSISTANT.get(memKey);
    if (existing) return existing;
    const created: ClientAssistant = {
      id: genId("ast_"),
      clientId,
      publicKey: genKey(),
      ...DEFAULTS(clientName),
    };
    MEM_ASSISTANT.set(memKey, created);
    return created;
  }

  if (!(await ownsClient(workspaceId, clientId))) {
    // Not this agency's client — return an ephemeral default (not persisted).
    return { id: genId("ast_"), clientId, publicKey: genKey(), ...DEFAULTS(clientName) };
  }

  const rows = (await sql()`
    SELECT id, client_id, name, tone, brand_colour, welcome_message,
           suggested_questions, lead_fields, public_key, enabled
    FROM assistants WHERE client_id = ${clientId} LIMIT 1
  `) as AsstRow[];
  const row = rows[0];
  if (row) return toAssistant(row);

  const created: ClientAssistant = {
    id: genId("ast_"),
    clientId,
    publicKey: genKey(),
    ...DEFAULTS(clientName),
  };
  await sql()`
    INSERT INTO assistants
      (id, client_id, name, tone, brand_colour, welcome_message,
       suggested_questions, lead_fields, public_key, enabled)
    VALUES
      (${created.id}, ${clientId}, ${created.name}, ${created.tone},
       ${created.brandColour}, ${created.welcomeMessage},
       ${JSON.stringify(created.suggestedQuestions)},
       ${JSON.stringify(created.leadFields)}, ${created.publicKey}, ${created.enabled})
  `;
  return created;
}

export async function saveClientAssistant(
  clientId: string,
  patch: Partial<Omit<ClientAssistant, "id" | "clientId" | "publicKey">>,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  const current = await getOrCreateClientAssistant(clientId, "Client");
  const next = { ...current, ...patch };
  if (!hasDb()) {
    MEM_ASSISTANT.set(`${workspaceId}:${clientId}`, next);
    return;
  }
  if (!(await ownsClient(workspaceId, clientId))) return;
  await sql()`
    UPDATE assistants SET
      name = ${next.name},
      tone = ${next.tone},
      brand_colour = ${next.brandColour},
      welcome_message = ${next.welcomeMessage},
      suggested_questions = ${JSON.stringify(next.suggestedQuestions)},
      lead_fields = ${JSON.stringify(next.leadFields)},
      enabled = ${next.enabled}
    WHERE client_id = ${clientId}
  `;
}

// ---- Knowledge sources ---------------------------------------------------

interface KnowRow {
  id: string;
  client_id: string;
  type: string | null;
  title: string | null;
  preview: string | null;
  status: string | null;
  created_at: string | Date;
}

function toKnowledge(r: KnowRow): KnowledgeSource {
  return {
    id: r.id,
    clientId: r.client_id,
    type: r.type ?? "text",
    title: r.title ?? "",
    preview: r.preview ?? "",
    status: r.status ?? "ready",
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function listKnowledge(clientId: string): Promise<KnowledgeSource[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    return MEM_KNOWLEDGE.filter(
      (k) => k.ws === `${workspaceId}:${clientId}`,
    ).map(({ ws: _ws, ...k }) => k);
  }
  const rows = (await sql()`
    SELECT k.id, k.client_id, k.type, k.title, k.preview, k.status, k.created_at
    FROM knowledge_sources k
    JOIN clients c ON c.id = k.client_id
    WHERE c.workspace_id = ${workspaceId} AND k.client_id = ${clientId}
    ORDER BY k.created_at DESC
  `) as KnowRow[];
  return rows.map(toKnowledge);
}

export async function addKnowledge(
  clientId: string,
  input: { type: string; title: string; preview: string },
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!(await ownsClient(workspaceId, clientId))) return;
  const source: KnowledgeSource = {
    id: genId("kn_"),
    clientId,
    type: input.type,
    title: input.title,
    preview: input.preview.slice(0, 280),
    status: "ready",
    createdAt: new Date().toISOString(),
  };
  if (!hasDb()) {
    MEM_KNOWLEDGE.push({ ...source, ws: `${workspaceId}:${clientId}` });
    return;
  }
  await sql()`
    INSERT INTO knowledge_sources (id, client_id, type, title, preview, status, created_at)
    VALUES (${source.id}, ${clientId}, ${source.type}, ${source.title},
            ${source.preview}, ${source.status}, ${source.createdAt})
  `;
}

export async function deleteKnowledge(clientId: string, id: string): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!(await ownsClient(workspaceId, clientId))) return;
  if (!hasDb()) {
    const i = MEM_KNOWLEDGE.findIndex((k) => k.id === id);
    if (i >= 0) MEM_KNOWLEDGE.splice(i, 1);
    return;
  }
  await sql()`DELETE FROM knowledge_sources WHERE id = ${id} AND client_id = ${clientId}`;
}
