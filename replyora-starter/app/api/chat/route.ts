import {
  getAssistantByPublicKey,
  REPLYORA_SITE_KEY,
} from "@/lib/data/assistant";
import { createAdminClient } from "@/lib/supabase/admin";
import { USE_SUPABASE } from "@/lib/data/mode";
import { DEMO_ASSISTANT, DEMO_WORKSPACE } from "@/lib/data/seed";
import { generateMockReply, tokenize } from "@/lib/ai/mock";
import {
  HAS_ANTHROPIC,
  CLINIC_CONTEXT,
  REPLYORA_CONTEXT,
  buildTenantContext,
  streamClaude,
} from "@/lib/ai/llm";
import { withinMessageCap } from "@/lib/usage";
import { answerFromNeon, getPublicAssistant } from "@/lib/social/public-chat";
import type { Assistant, Plan } from "@/lib/data/types";

/**
 * Public chat endpoint.
 *
 * With an Anthropic key set: streams a real Claude reply grounded in the
 * business's context. Without one: streams the scripted demo responder. Same
 * plain-text streaming contract either way, so the widget UI is unchanged.
 *
 * // TODO (RAG): retrieve tenant knowledge chunks (match_chunks) into the
 * context, enforce Origin allowlist + rate limit + plan cap, and persist messages.
 */

export const runtime = "nodejs";

interface ChatRequestBody {
  publicKey?: string;
  conversationId?: string;
  visitorId?: string;
  message?: string;
}

const STREAM_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Accel-Buffering": "no",
};

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { publicKey, message } = body;
  if (!publicKey || typeof message !== "string" || message.trim() === "") {
    return new Response("Missing publicKey or message", { status: 400 });
  }

  // ReplyOra Social chatbox (Neon-backed rk_ keys) — try first, then fall
  // through to the legacy Supabase assistant if this key isn't a Neon one.
  const neonAssistant = await getPublicAssistant(publicKey);
  if (neonAssistant) {
    const reply = await answerFromNeon(neonAssistant, message);
    const encoder = new TextEncoder();
    const parts = reply.split(/(\s+)/);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const part of parts) {
          controller.enqueue(encoder.encode(part));
          await delay(18);
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: STREAM_HEADERS });
  }

  const assistant = await getAssistantByPublicKey(publicKey);
  if (!assistant) {
    return new Response("Unknown assistant", { status: 404 });
  }

  // Enforce the workspace's monthly message cap (real tenants only).
  const capMessage = await enforceMessageCap(publicKey, assistant);
  if (capMessage) {
    return new Response(capMessage, { headers: STREAM_HEADERS });
  }

  // Record the visitor's message so the owner can see the live conversation and
  // take it over (enables real-time handoff). Best-effort; never blocks the reply.
  await persistVisitorMessage(publicKey, assistant, body);

  if (HAS_ANTHROPIC) {
    const { businessName, context } = await resolveContext(publicKey, assistant);
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamClaude({
            assistant,
            businessName,
            context,
            message,
          })) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch {
          controller.enqueue(
            encoder.encode(
              "Sorry — I'm having trouble answering right now. Please try again in a moment.",
            ),
          );
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: STREAM_HEADERS });
  }

  // Scripted demo fallback (no Anthropic key).
  const reply = generateMockReply(message, assistant.name);
  const tokens = tokenize(reply);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      await delay(280);
      for (const token of tokens) {
        controller.enqueue(encoder.encode(token));
        await delay(28 + Math.floor(Math.random() * 36));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: STREAM_HEADERS });
}

/** Pick the right business context for the assistant behind this public key. */
async function resolveContext(
  publicKey: string,
  assistant: Assistant,
): Promise<{ businessName: string; context: string }> {
  if (publicKey === REPLYORA_SITE_KEY) {
    return { businessName: "Replyora", context: REPLYORA_CONTEXT };
  }
  if (publicKey === DEMO_ASSISTANT.publicKey || !USE_SUPABASE) {
    return {
      businessName: DEMO_WORKSPACE.name,
      context: CLINIC_CONTEXT,
    };
  }

  // Real tenant — pull their workspace name + business profile (service role).
  try {
    const supabase = createAdminClient();
    const [{ data: ws }, { data: bp }] = await Promise.all([
      supabase
        .from("workspaces")
        .select("name")
        .eq("id", assistant.workspaceId)
        .maybeSingle(),
      supabase
        .from("business_profiles")
        .select("industry, description, website, phone, email, address")
        .eq("workspace_id", assistant.workspaceId)
        .maybeSingle(),
    ]);
    const businessName = (ws?.name as string) || "our business";
    return { businessName, context: buildTenantContext(bp, businessName) };
  } catch {
    return {
      businessName: "our business",
      context: buildTenantContext(null, "our business"),
    };
  }
}

/**
 * Enforce the monthly message allowance for real tenants. Returns a friendly
 * "limit reached" message to stream back, or null if the message is allowed
 * (and best-effort increments the counter). Demos and mock mode aren't metered.
 */
async function enforceMessageCap(
  publicKey: string,
  assistant: Assistant,
): Promise<string | null> {
  if (
    !USE_SUPABASE ||
    publicKey === REPLYORA_SITE_KEY ||
    publicKey === DEMO_ASSISTANT.publicKey
  ) {
    return null;
  }
  try {
    const supabase = createAdminClient();
    const wsId = assistant.workspaceId;
    const [{ data: ws }, { data: usage }] = await Promise.all([
      supabase.from("workspaces").select("plan").eq("id", wsId).maybeSingle(),
      supabase
        .from("usage_counters")
        .select("period_start, messages_used")
        .eq("workspace_id", wsId)
        .order("period_start", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    const plan = (ws?.plan as Plan) ?? "none";
    const used = (usage?.messages_used as number) ?? 0;
    if (!withinMessageCap(plan, used)) {
      return "Thanks for reaching out! We've reached our message limit for this month — leave your name and best email and the team will get right back to you.";
    }
    const period =
      (usage?.period_start as string) ??
      new Date().toISOString().slice(0, 10);
    await supabase
      .from("usage_counters")
      .upsert(
        { workspace_id: wsId, period_start: period, messages_used: used + 1 },
        { onConflict: "workspace_id,period_start" },
      );
    return null;
  } catch {
    return null; // fail open — never block a paying customer on a metering error
  }
}

/**
 * Persist the visitor's message (real tenants only) so it surfaces in the owner's
 * dashboard and a teammate can take over. AI replies are intentionally NOT
 * persisted here, which keeps the handoff poll unambiguous (every stored
 * assistant-role message is a human takeover). Best-effort — swallows all errors.
 */
async function persistVisitorMessage(
  publicKey: string,
  assistant: Assistant,
  body: ChatRequestBody,
): Promise<void> {
  const conversationId = body.conversationId;
  if (
    !USE_SUPABASE ||
    !conversationId ||
    publicKey === REPLYORA_SITE_KEY ||
    publicKey === DEMO_ASSISTANT.publicKey
  ) {
    return;
  }
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    await supabase.from("conversations").upsert(
      {
        id: conversationId,
        workspace_id: assistant.workspaceId,
        assistant_id: assistant.id,
        visitor_id: body.visitorId ?? null,
        status: "open",
        last_message_at: now,
      },
      { onConflict: "id" },
    );
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      workspace_id: assistant.workspaceId,
      role: "user",
      content: (body.message ?? "").slice(0, 4000),
    });
  } catch {
    // Never block a live chat on a persistence hiccup.
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
