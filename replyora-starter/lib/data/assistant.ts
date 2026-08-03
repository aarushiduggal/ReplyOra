import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";

import { DEMO_ASSISTANT } from "./seed";
import type { Assistant, LeadField } from "./types";

/** Public key for Replyora's own assistant, dogfooded on the marketing site. */
export const REPLYORA_SITE_KEY = "rk_replyora_site_public";

interface AssistantRow {
  id: string;
  workspace_id: string;
  public_key: string;
  name: string | null;
  tone: string | null;
  model: string | null;
  temperature: number | null;
  brand_color: string | null;
  welcome_message: string | null;
  suggested_questions: unknown;
  lead_fields: unknown;
  allowed_domains: string[] | null;
  status: string | null;
}

function mapAssistant(row: AssistantRow): Assistant {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    publicKey: row.public_key,
    name: row.name ?? "Assistant",
    tone: (row.tone as Assistant["tone"]) ?? "friendly",
    model: row.model ?? "claude-haiku",
    temperature: Number(row.temperature ?? 0.3),
    brandColor: row.brand_color ?? "#5C1A1A",
    welcomeMessage: row.welcome_message ?? "Hi! How can I help you today?",
    suggestedQuestions: (row.suggested_questions as string[]) ?? [],
    leadFields: (row.lead_fields as LeadField[]) ?? [],
    allowedDomains: row.allowed_domains ?? [],
    status: (row.status as Assistant["status"]) ?? "active",
  };
}

/** Strip any leaked demo (Coastal Glow) values from a real workspace's assistant
 * so a polluted row never shows demo branding. */
function scrubDemo(a: Assistant): Assistant {
  const cleaned = { ...a };
  if (cleaned.name === DEMO_ASSISTANT.name) cleaned.name = "Assistant";
  if (cleaned.welcomeMessage === DEMO_ASSISTANT.welcomeMessage) {
    cleaned.welcomeMessage = "Hi! 👋 How can I help you today?";
  }
  if (
    JSON.stringify(cleaned.suggestedQuestions) ===
    JSON.stringify(DEMO_ASSISTANT.suggestedQuestions)
  ) {
    cleaned.suggestedQuestions = [];
  }
  return cleaned;
}

/** A neutral default assistant for a brand-new/real workspace (never the demo). */
function neutralAssistant(workspaceId: string, publicKey: string): Assistant {
  return {
    id: `asst_${workspaceId}`,
    workspaceId,
    publicKey,
    name: "Assistant",
    tone: "friendly",
    model: "claude-haiku",
    temperature: 0.3,
    brandColor: "#5C1A1A",
    welcomeMessage: "Hi! 👋 How can I help you today?",
    suggestedQuestions: [],
    leadFields: [
      { key: "name", label: "Full name", required: true },
      { key: "email", label: "Email", required: true },
      { key: "phone", label: "Phone", required: false },
    ],
    allowedDomains: [],
    status: "active",
  };
}

/** The workspace's assistant config (1 per workspace in MVP). */
export async function getAssistant(): Promise<Assistant> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) return DEMO_ASSISTANT;

  const supabase = await createClient();
  const { data } = await supabase
    .from("assistants")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (data) return scrubDemo(mapAssistant(data as AssistantRow));

  // No row visible — self-heal for accounts created before the assistant
  // trigger, via the service role. NEVER fall back to the Coastal Glow demo.
  try {
    const admin = createAdminClient();
    const existing = await admin
      .from("assistants")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (existing.data) return scrubDemo(mapAssistant(existing.data as AssistantRow));

    const publicKey = `rk_${Math.random().toString(36).slice(2, 10)}${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    const inserted = await admin
      .from("assistants")
      .insert({ workspace_id: workspaceId, public_key: publicKey, name: "Assistant" })
      .select("*")
      .maybeSingle();
    if (inserted.data) return mapAssistant(inserted.data as AssistantRow);
    return neutralAssistant(workspaceId, publicKey);
  } catch {
    return neutralAssistant(workspaceId, `rk_${workspaceId.slice(0, 12)}`);
  }
}

/** Resolve an assistant by public key (widget / public chat path). */
export async function getAssistantByPublicKey(
  publicKey: string,
): Promise<Assistant | null> {
  // Marketing-site demo assistants resolve the same in every mode.
  if (publicKey === REPLYORA_SITE_KEY) {
    return { ...DEMO_ASSISTANT, name: "Replyora Assistant", publicKey };
  }
  if (!USE_SUPABASE || publicKey === DEMO_ASSISTANT.publicKey) {
    return DEMO_ASSISTANT;
  }

  // Live: real tenant lookup via the service role (public path, RLS-bypass,
  // scoped by public_key only).
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("assistants")
      .select("*")
      .eq("public_key", publicKey)
      .maybeSingle();
    return data ? mapAssistant(data as AssistantRow) : null;
  } catch {
    return null;
  }
}

export async function updateAssistant(
  patch: Partial<Assistant>,
): Promise<Assistant> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) {
    // Persist in-session so the preview + widget reflect edits.
    Object.assign(DEMO_ASSISTANT, patch);
    return DEMO_ASSISTANT;
  }

  const supabase = await createClient();
  await supabase
    .from("assistants")
    .update({
      name: patch.name,
      tone: patch.tone,
      model: patch.model,
      temperature: patch.temperature,
      brand_color: patch.brandColor,
      welcome_message: patch.welcomeMessage,
      suggested_questions: patch.suggestedQuestions,
      lead_fields: patch.leadFields,
      allowed_domains: patch.allowedDomains,
    })
    .eq("workspace_id", workspaceId);

  return { ...(await getAssistant()), ...patch };
}
