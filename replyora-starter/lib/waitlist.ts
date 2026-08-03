import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { USE_SUPABASE } from "@/lib/data/mode";
import { mockState, type WaitlistEntry } from "@/lib/admin/mock-state";

/**
 * Feature waitlist ("Notify me") — see 0003_waitlist.sql.
 *
 * Capture is a PUBLIC action (marketing site + dashboard), so it runs
 * server-side via the SERVICE ROLE in live mode (mirrors the public chat path),
 * or the process-global mock store in local mode. Reads are staff-only.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export interface WaitlistInput {
  email: string;
  feature?: string;
  source?: string;
  workspaceId?: string | null;
}

/** Record interest. Idempotent per (email, feature) — signing up twice is fine. */
export async function addWaitlistSignup(input: WaitlistInput): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const feature = (input.feature ?? "voice").trim() || "voice";
  const source = (input.source ?? "roadmap").trim() || "roadmap";

  if (!USE_SUPABASE) {
    const exists = mockState.waitlist.some(
      (w) => w.email.toLowerCase() === email && w.feature === feature,
    );
    if (!exists) {
      mockState.waitlist.unshift({
        id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        email,
        feature,
        source,
        createdAt: new Date().toISOString(),
      });
    }
    return;
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("waitlist_signups").insert({
      email,
      feature,
      source,
      workspace_id: input.workspaceId ?? null,
    });
    // 23505 = unique violation → already on the list, which is success for us.
    if (error && error.code !== "23505") {
      throw error;
    }
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code !== "23505") throw err;
  }
}

export interface WaitlistSignup {
  id: string;
  email: string;
  feature: string;
  source: string;
  createdAt: string;
}

/** Every waitlist signup, newest first — staff portal only. */
export async function listWaitlist(): Promise<WaitlistSignup[]> {
  if (!USE_SUPABASE) {
    return [...mockState.waitlist]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toSignup);
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("waitlist_signups")
      .select("id, email, feature, source, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      email: (r.email as string) ?? "",
      feature: (r.feature as string) ?? "voice",
      source: (r.source as string) ?? "roadmap",
      createdAt: r.created_at as string,
    }));
  } catch {
    return [];
  }
}

function toSignup(w: WaitlistEntry): WaitlistSignup {
  return {
    id: w.id,
    email: w.email,
    feature: w.feature,
    source: w.source,
    createdAt: w.createdAt,
  };
}
