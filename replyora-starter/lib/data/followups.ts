import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";

import { DEFAULT_FOLLOWUP } from "./seed";
import type { FollowupRule } from "./types";

// Generic default for a real new workspace (no demo business name).
const LIVE_DEFAULT_FOLLOWUP: FollowupRule = {
  enabled: false,
  targetStatus: "new",
  delayHours: 24,
  message:
    "Hi {name}, just checking in on your enquiry about {service} — would you like us to hold a time for you this week?",
};

/**
 * Follow-up automation rule: auto-nudge leads that go cold.
 * // TODO: persist per-workspace + a scheduled job (cron / queue) that sends.
 */
export async function getFollowupRule(): Promise<FollowupRule> {
  await getCurrentWorkspaceId();
  if (USE_SUPABASE) return LIVE_DEFAULT_FOLLOWUP;
  return DEFAULT_FOLLOWUP;
}

export async function updateFollowupRule(
  patch: Partial<FollowupRule>,
): Promise<FollowupRule> {
  await getCurrentWorkspaceId();
  return { ...DEFAULT_FOLLOWUP, ...patch };
}
