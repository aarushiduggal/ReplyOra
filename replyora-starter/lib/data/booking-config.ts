import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";

/**
 * Where the assistant sources bookable times.
 *  - "hours"    → generate slots from the business opening hours (native flow)
 *  - "calendly" → hand the visitor to a connected Calendly / Google Calendar link
 *
 * Mock-mode config is in-memory (resets on reload). // TODO: persist to a
 * `booking_settings` table + real Google Calendar / Calendly OAuth.
 */
export type AvailabilitySource = "hours" | "calendly";

export interface BookingConfig {
  source: AvailabilitySource;
  /** External scheduling URL (Calendly, or a Google Calendar appointment page). */
  externalUrl: string | null;
}

const DEMO_BOOKING_CONFIG: BookingConfig = {
  source: "hours",
  externalUrl: null,
};

export async function getBookingConfig(): Promise<BookingConfig> {
  await getCurrentWorkspaceId();
  if (!USE_SUPABASE) return { ...DEMO_BOOKING_CONFIG };
  // Live: no table yet — default to opening-hours slots.
  return { source: "hours", externalUrl: null };
}

export async function updateBookingConfig(
  patch: Partial<BookingConfig>,
): Promise<BookingConfig> {
  await getCurrentWorkspaceId();
  const next: BookingConfig = { ...DEMO_BOOKING_CONFIG, ...patch };
  // Normalise: a Calendly source needs a URL to be usable.
  if (next.source === "calendly" && !next.externalUrl) next.source = "hours";
  if (!USE_SUPABASE) return next;
  // // TODO: upsert into booking_settings for the workspace.
  return next;
}
