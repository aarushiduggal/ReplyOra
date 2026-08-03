import { getAssistantByPublicKey } from "@/lib/data/assistant";
import { createAdminClient } from "@/lib/supabase/admin";
import { USE_SUPABASE } from "@/lib/data/mode";
import { DEMO_CONVERSATIONS } from "@/lib/data/seed";

/**
 * Real-time handoff poll.
 *
 * The visitor's widget polls this to receive messages a human teammate sends
 * after taking over the conversation (via the dashboard composer → addHumanMessage).
 * Returns only human/teammate messages created after the `after` cursor, so the
 * widget never double-renders its own AI replies.
 *
 * Live: AI replies aren't persisted, so every `role='assistant'` row for the
 * conversation is a human takeover. We hard-scope by the assistant's workspace to
 * prevent cross-tenant polling with a guessed conversation id.
 * Mock: reads the seeded conversation store for `author='human'` messages.
 */
export const runtime = "nodejs";

interface HumanMessage {
  content: string;
  createdAt: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const publicKey = url.searchParams.get("publicKey");
  const conversationId = url.searchParams.get("conversationId");
  const after = url.searchParams.get("after");

  if (!publicKey || !conversationId) {
    return json({ messages: [] });
  }

  const assistant = await getAssistantByPublicKey(publicKey);
  if (!assistant) {
    return json({ messages: [] });
  }

  const afterMs = after ? Date.parse(after) : 0;

  if (!USE_SUPABASE) {
    const conv = DEMO_CONVERSATIONS.find((c) => c.id === conversationId);
    const messages: HumanMessage[] = (conv?.messages ?? [])
      .filter(
        (m) =>
          m.author === "human" &&
          (!afterMs || Date.parse(m.createdAt) > afterMs),
      )
      .map((m) => ({ content: m.content, createdAt: m.createdAt }));
    return json({ messages });
  }

  try {
    const supabase = createAdminClient();
    // Verify the conversation belongs to this assistant's workspace first.
    const { data: conv } = await supabase
      .from("conversations")
      .select("workspace_id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!conv || conv.workspace_id !== assistant.workspaceId) {
      return json({ messages: [] });
    }

    let query = supabase
      .from("messages")
      .select("content, created_at")
      .eq("conversation_id", conversationId)
      .eq("role", "assistant")
      .order("created_at", { ascending: true });
    if (after) query = query.gt("created_at", after);

    const { data } = await query;
    const messages: HumanMessage[] = (data ?? []).map((m) => ({
      content: m.content as string,
      createdAt: m.created_at as string,
    }));
    return json({ messages });
  } catch {
    return json({ messages: [] });
  }
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
