import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";

import { notifyOwner } from "./notifications";
import { DEMO_CONVERSATIONS } from "./seed";
import type {
  Conversation,
  ConversationMessage,
  ConversationNote,
  ConversationStatus,
  HandledBy,
  Lead,
} from "./types";

interface ConversationRow {
  id: string;
  workspace_id: string;
  visitor_id: string | null;
  page_url: string | null;
  status: string | null;
  started_at: string;
  last_message_at: string;
}

// handled_by / notes / preview aren't columns in 0001_init yet — defaulted in
// live mode. // TODO: migration for conversation handoff + notes + denorm fields.
function mapConversation(
  row: ConversationRow,
  messages: ConversationMessage[] = [],
): Conversation {
  const last = messages[messages.length - 1];
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    visitorId: row.visitor_id ?? "",
    pageUrl: row.page_url ?? "",
    status: (row.status as ConversationStatus) ?? "open",
    handledBy: "assistant",
    preview: last?.content ?? "",
    messageCount: messages.length,
    capturedLead: false,
    startedAt: row.started_at,
    lastMessageAt: row.last_message_at,
    messages,
    notes: [],
  };
}

export async function listConversations(): Promise<Conversation[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) {
    return [...DEMO_CONVERSATIONS].sort((a, b) =>
      b.lastMessageAt.localeCompare(a.lastMessageAt),
    );
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("last_message_at", { ascending: false });
    return (data ?? []).map((r) => mapConversation(r as ConversationRow));
  } catch {
    return [];
  }
}

export async function getConversation(
  id: string,
): Promise<Conversation | null> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) {
    return DEMO_CONVERSATIONS.find((c) => c.id === id) ?? null;
  }
  try {
    const supabase = await createClient();
    const { data: row } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (!row) return null;
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    const messages: ConversationMessage[] = (msgs ?? []).map((m) => ({
      id: m.id,
      role: (m.role as ConversationMessage["role"]) ?? "user",
      content: m.content,
      createdAt: m.created_at,
    }));
    return mapConversation(row as ConversationRow, messages);
  } catch {
    return null;
  }
}

/** Toggle who is driving the conversation. */
export async function setHandledBy(
  id: string,
  handledBy: HandledBy,
): Promise<void> {
  await getCurrentWorkspaceId();
  if (!USE_SUPABASE) {
    const c = DEMO_CONVERSATIONS.find((x) => x.id === id);
    if (c) c.handledBy = handledBy;
    return;
  }
  // Live: handled_by isn't a column in 0001 yet. // TODO: migration for handoff.
}

/**
 * Append a human teammate's reply to a conversation (live takeover). Marks the
 * conversation as human-handled and returns the new message.
 *
 * The visitor's widget picks this up in near-real-time by polling
 * `/api/chat/poll` for `role='assistant'` messages (which, since AI replies
 * aren't persisted, are exactly the human takeovers). See that route.
 */
export async function addHumanMessage(
  id: string,
  text: string,
): Promise<ConversationMessage> {
  const workspaceId = await getCurrentWorkspaceId();
  const now = new Date().toISOString();
  const msg: ConversationMessage = {
    id: `m_${Math.random().toString(36).slice(2, 10)}`,
    role: "assistant",
    author: "human",
    content: text,
    createdAt: now,
  };
  if (!USE_SUPABASE) {
    const c = DEMO_CONVERSATIONS.find((x) => x.id === id);
    if (c) {
      c.messages.push(msg);
      c.messageCount = c.messages.length;
      c.lastMessageAt = now;
      c.handledBy = "human";
    }
    return msg;
  }
  const supabase = await createClient();
  // workspace_id is NOT NULL on messages — include it, scoped to this session.
  await supabase.from("messages").insert({
    conversation_id: id,
    workspace_id: workspaceId,
    role: "assistant",
    content: text,
  });
  await supabase
    .from("conversations")
    .update({ last_message_at: now })
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  return msg;
}

export async function addConversationNote(
  id: string,
  author: string,
  body: string,
): Promise<ConversationNote> {
  await getCurrentWorkspaceId();
  void id;
  return {
    id: `n_${Math.random().toString(36).slice(2, 8)}`,
    author,
    body,
    createdAt: new Date().toISOString(),
  };
}

/** Convert a conversation into a lead (manual capture by the owner). */
export async function convertConversationToLead(
  conversation: Conversation,
  fields: { name: string; email: string; phone: string; intent: string },
): Promise<Lead> {
  const workspaceId = await getCurrentWorkspaceId();
  const lead: Lead = {
    id: `lead_${Math.random().toString(36).slice(2, 10)}`,
    workspaceId,
    conversationId: conversation.id,
    name: fields.name,
    email: fields.email,
    phone: fields.phone,
    intent: fields.intent,
    status: "new",
    score: "warm",
    scoreValue: 55,
    qualification: { service: null, urgency: null, suburb: null, budget: null },
    createdAt: new Date().toISOString(),
  };

  // Alert the owner (in-app + best-effort email via the seam).
  await notifyOwner({
    type: "lead",
    title: `New lead — ${fields.name}`,
    body: `${fields.intent || "New enquiry"}${fields.email ? ` · ${fields.email}` : ""}`,
    href: "/dashboard/leads",
  });

  if (!USE_SUPABASE) return lead;

  const supabase = await createClient();
  await supabase.from("leads").insert({
    workspace_id: workspaceId,
    conversation_id: conversation.id,
    name: fields.name,
    email: fields.email,
    phone: fields.phone,
    intent: fields.intent,
    status: "new",
  });
  return lead;
}
