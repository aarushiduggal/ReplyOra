import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { generateSlots } from "@/lib/booking-slots";
import { USE_SUPABASE } from "@/lib/data/mode";

import { DEMO_BOOKINGS, DEMO_BUSINESS_PROFILE } from "./seed";
import type { Booking, TimeSlot } from "./types";

/**
 * Upcoming + past bookings for the workspace.
 * Live mode returns empty until a `bookings` table exists.
 * // TODO: add a bookings migration + real queries.
 */
export async function listBookings(): Promise<Booking[]> {
  await getCurrentWorkspaceId();
  if (USE_SUPABASE) return [];
  return [...DEMO_BOOKINGS].sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Generate bookable slots from a default opening-hours template.
 * Public (no session required) — used on marketing pages and the widget.
 * // TODO: replace with the workspace's real availability (Calendly / Google).
 */
export async function getAvailableSlots(
  from: Date = new Date(),
  days = 7,
  perDay = 4,
): Promise<TimeSlot[]> {
  return generateSlots(DEMO_BUSINESS_PROFILE.hours, from, days, perDay);
}

export interface NewBooking {
  customerName: string;
  customerEmail: string;
  service: string;
  start: string;
  leadId?: string | null;
  conversationId?: string | null;
}

/**
 * Create a booking (and, in the real app, advance the linked lead to "booked"
 * and fire an owner notification).
 * // TODO: replace with Supabase insert + lead status update + notification.
 */
export async function createBooking(input: NewBooking): Promise<Booking> {
  const workspaceId = await getCurrentWorkspaceId();
  const start = new Date(input.start);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    id: `bk_${Math.random().toString(36).slice(2, 10)}`,
    workspaceId,
    leadId: input.leadId ?? null,
    conversationId: input.conversationId ?? null,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    service: input.service,
    start: start.toISOString(),
    end: end.toISOString(),
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
}
