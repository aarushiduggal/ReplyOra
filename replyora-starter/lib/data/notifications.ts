import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEMO_NOTIFICATIONS,
  DEMO_USER,
} from "./seed";
import type { NotificationItem, NotificationSettings } from "./types";

/**
 * Owner notifications (newest first).
 * Live mode returns empty until a notifications table exists.
 * // TODO: add a notifications migration + realtime subscription.
 */
export async function listNotifications(): Promise<NotificationItem[]> {
  await getCurrentWorkspaceId();
  if (USE_SUPABASE) return [];
  return [...DEMO_NOTIFICATIONS].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function unreadNotificationCount(): Promise<number> {
  const items = await listNotifications();
  return items.filter((n) => !n.read).length;
}

/** Mock: no persistence. // TODO: replace with Supabase update. */
export async function markAllNotificationsRead(): Promise<void> {
  await getCurrentWorkspaceId();
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  await getCurrentWorkspaceId();
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export async function updateNotificationSettings(
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  await getCurrentWorkspaceId();
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...patch };
}

/**
 * Fire an owner alert. Shows an in-app item and best-effort emails the owner via
 * the email seam (`lib/email.ts`) — which no-ops until RESEND_API_KEY is set, so
 * this is safe to call everywhere now and "just works" once a provider is keyed.
 * // TODO: also persist to a notifications table + SMS (Twilio) + web push.
 */
export async function notifyOwner(
  item: Omit<NotificationItem, "id" | "workspaceId" | "read" | "createdAt">,
): Promise<NotificationItem> {
  const workspaceId = await getCurrentWorkspaceId();

  // Best-effort email fan-out through the seam — never blocks the caller.
  void resolveOwnerEmail(workspaceId).then((to) => {
    if (!to) return;
    return sendEmail({
      to,
      subject: item.title,
      text: `${item.body}\n\nOpen your Replyora dashboard: https://replyora-starter.vercel.app${item.href ?? "/dashboard"}`,
    });
  });

  return {
    ...item,
    id: `ntf_${Math.random().toString(36).slice(2, 10)}`,
    workspaceId,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

/** Resolve the owner's email for a workspace (mock → demo user; live → lookup). */
async function resolveOwnerEmail(workspaceId: string): Promise<string | null> {
  if (!USE_SUPABASE) return DEMO_USER.email;
  try {
    const admin = createAdminClient();
    const { data: ws } = await admin
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .maybeSingle();
    const ownerId = ws?.owner_id as string | undefined;
    if (!ownerId) return null;
    // Email lives in auth.users, not profiles — use the admin auth API.
    const { data: user } = await admin.auth.admin.getUserById(ownerId);
    return user?.user?.email ?? null;
  } catch {
    return null;
  }
}
