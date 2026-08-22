import "server-only";

/**
 * Notion mirror for waitlist signups.
 *
 * Dormant until NOTION_TOKEN and NOTION_WAITLIST_DB_ID are set (same pattern as
 * lib/email.ts). Never throws: a failed mirror must not turn someone's
 * successful signup into an error — Neon is the source of truth, Notion is a
 * convenience.
 *
 * SCHEMA-ADAPTIVE ON PURPOSE. Notion rejects the whole page if you send a
 * property that doesn't exist, or send the wrong type for one. Hard-coding
 * column names would mean a signup silently vanishing the first time you
 * renamed a column. Instead we read the database's real schema once and fill in
 * only the columns that are actually there, matched by name and type.
 *
 * Env:
 *   NOTION_TOKEN          — internal integration secret (starts "ntn_"/"secret_")
 *   NOTION_WAITLIST_DB_ID — the database id from its URL
 */

const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

export const HAS_NOTION = Boolean(
  process.env.NOTION_TOKEN && process.env.NOTION_WAITLIST_DB_ID,
);

export interface NotionResult {
  sent: boolean;
  reason?: string;
}

interface PropSchema {
  id: string;
  name: string;
  type: string;
}

// The schema rarely changes, so fetch it once per warm instance.
let schemaCache: Record<string, PropSchema> | null = null;

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    "Notion-Version": VERSION,
    "Content-Type": "application/json",
  };
}

async function loadSchema(): Promise<Record<string, PropSchema> | null> {
  if (schemaCache) return schemaCache;
  try {
    const res = await fetch(
      `${API}/databases/${process.env.NOTION_WAITLIST_DB_ID}`,
      { headers: headers(), signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[notion] could not read the database (HTTP ${res.status}). ` +
          `Check the id, and that the database is shared with the integration. ${body.slice(0, 200)}`,
      );
      return null;
    }
    const data = (await res.json()) as {
      properties?: Record<string, { id: string; type: string }>;
    };
    const out: Record<string, PropSchema> = {};
    for (const [name, def] of Object.entries(data.properties ?? {})) {
      out[name.toLowerCase()] = { id: def.id, name, type: def.type };
    }
    schemaCache = out;
    return out;
  } catch (err) {
    console.error("[notion] schema fetch failed", err);
    return null;
  }
}

/** First property matching any of these names, optionally of a given type. */
function pick(
  schema: Record<string, PropSchema>,
  names: string[],
  type?: string,
): PropSchema | null {
  for (const n of names) {
    const hit = schema[n.toLowerCase()];
    if (hit && (!type || hit.type === type)) return hit;
  }
  if (type) {
    // Fall back to any property of the right type — covers a differently named
    // but obviously correct column (e.g. "Contact" for the email).
    const byType = Object.values(schema).find((p) => p.type === type);
    if (byType) return byType;
  }
  return null;
}

/** Build a value in whatever shape that column's type expects. */
function valueFor(type: string, text: string): unknown | null {
  switch (type) {
    case "title":
      return { title: [{ text: { content: text.slice(0, 2000) } }] };
    case "rich_text":
      return { rich_text: [{ text: { content: text.slice(0, 2000) } }] };
    case "email":
      return { email: text };
    case "select":
      return { select: { name: text.slice(0, 100) } };
    case "multi_select":
      return { multi_select: [{ name: text.slice(0, 100) }] };
    case "status":
      return { status: { name: text.slice(0, 100) } };
    case "url":
      return { url: text };
    case "phone_number":
      return { phone_number: text };
    default:
      return null;
  }
}

export interface NotionWaitlistEntry {
  email: string;
  name?: string | null;
  role?: string | null;
  source?: string | null;
}

/** Mirror one signup into Notion. Fire-and-forget; never throws. */
export async function addWaitlistToNotion(
  entry: NotionWaitlistEntry,
): Promise<NotionResult> {
  if (!HAS_NOTION) return { sent: false, reason: "notion not configured" };

  const schema = await loadSchema();
  if (!schema) return { sent: false, reason: "could not read database schema" };

  const properties: Record<string, unknown> = {};
  const set = (
    prop: PropSchema | null,
    text: string | null | undefined,
  ): void => {
    if (!prop || !text) return;
    const v = valueFor(prop.type, text);
    if (v !== null) properties[prop.name] = v;
  };

  // Every Notion database has exactly one title column, whatever it's called.
  const title = Object.values(schema).find((p) => p.type === "title") ?? null;
  set(title, entry.name || entry.email);
  set(pick(schema, ["email", "e-mail", "contact"], "email"), entry.email);
  set(pick(schema, ["role", "what do you do", "type"]), entry.role);
  set(pick(schema, ["source", "from"]), entry.source);
  set(pick(schema, ["status", "stage"]), "New");

  const dateProp = pick(schema, ["signed up", "date", "created"], "date");
  if (dateProp) {
    properties[dateProp.name] = { date: { start: new Date().toISOString() } };
  }

  if (Object.keys(properties).length === 0) {
    return { sent: false, reason: "no usable columns in that database" };
  }

  try {
    const res = await fetch(`${API}/pages`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_WAITLIST_DB_ID },
        properties,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let msg = body.slice(0, 200);
      try {
        msg = (JSON.parse(body) as { message?: string }).message ?? msg;
      } catch {
        /* keep the raw snippet */
      }
      // A stale cached schema is a likely cause — drop it so the next signup
      // re-reads the columns instead of failing the same way forever.
      schemaCache = null;
      console.error(`[notion] page create failed (HTTP ${res.status}): ${msg}`);
      return { sent: false, reason: msg };
    }
    return { sent: true };
  } catch (err) {
    console.error("[notion] page create threw", err);
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "request failed",
    };
  }
}
