import type { Workspace } from "./types";

/**
 * Is the workspace entitled to use paid features (deploy/use an assistant)?
 * - active paid subscription → yes
 * - trialing and still within the trial window → yes
 * - trial expired / canceled / past due → no (locked behind the paywall)
 *
 * Real payment that flips a workspace to "active" arrives with Stripe (next).
 */
export function isEntitled(ws: Workspace): boolean {
  if (ws.planStatus === "active") return true;
  if (ws.planStatus === "trialing") {
    if (!ws.trialEndsAt) return true;
    return new Date(ws.trialEndsAt).getTime() > Date.now();
  }
  return false;
}

/** Days left in the trial (0 if ended), or null if not on a trial. */
export function trialDaysLeft(ws: Workspace): number | null {
  if (ws.planStatus !== "trialing" || !ws.trialEndsAt) return null;
  const ms = new Date(ws.trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

export type EntitlementState = "active" | "trialing" | "trial_ended" | "locked";

export function entitlementState(ws: Workspace): EntitlementState {
  if (ws.planStatus === "active") return "active";
  if (ws.planStatus === "trialing") {
    return isEntitled(ws) ? "trialing" : "trial_ended";
  }
  return "locked";
}
