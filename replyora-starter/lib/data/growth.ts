import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";

/**
 * Mock data for the Stage-2 premium "growth engines" (abandoned recovery,
 * review requests, no-show reminders, lead win-back, continuous retraining).
 * Live mode returns empty until real tables + jobs exist. // TODO: Supabase.
 */

export type Status2 = "pending" | "sent" | "done";

export interface AbandonedEnquiry {
  id: string;
  visitor: string;
  lastMessage: string;
  droppedAt: string;
  stage: "chat" | "booking";
  status: Status2;
}
export interface ReviewRequest {
  id: string;
  customer: string;
  service: string;
  completedAt: string;
  status: "pending" | "sent" | "clicked";
}
export interface BookingReminder {
  id: string;
  customer: string;
  service: string;
  start: string;
  status: "scheduled" | "sent" | "confirmed";
}
export interface WinbackLead {
  id: string;
  name: string;
  intent: string;
  lastSeen: string;
  status: Status2;
}
export interface UnansweredQuestion {
  id: string;
  question: string;
  count: number;
  lastAsked: string;
  resolved: boolean;
}

const ABANDONED: AbandonedEnquiry[] = [
  { id: "ab_1", visitor: "vis_7f2", lastMessage: "How much for a full-leg laser course?", droppedAt: "2026-06-30T21:14:00.000Z", stage: "chat", status: "pending" },
  { id: "ab_2", visitor: "vis_9a1", lastMessage: "Started booking a HydraFacial…", droppedAt: "2026-06-30T19:40:00.000Z", stage: "booking", status: "pending" },
  { id: "ab_3", visitor: "vis_3c8", lastMessage: "Do you do payment plans?", droppedAt: "2026-06-29T23:05:00.000Z", stage: "chat", status: "sent" },
];

const REVIEWS: ReviewRequest[] = [
  { id: "rv_1", customer: "Sophie Turner", service: "HydraFacial", completedAt: "2026-06-30T04:00:00.000Z", status: "pending" },
  { id: "rv_2", customer: "Renee Adams", service: "Skin consultation", completedAt: "2026-06-28T05:00:00.000Z", status: "sent" },
  { id: "rv_3", customer: "Olivia Brennan", service: "Wedding-prep package", completedAt: "2026-06-27T02:00:00.000Z", status: "clicked" },
];

const REMINDERS: BookingReminder[] = [
  { id: "rm_1", customer: "Sophie Turner", service: "HydraFacial", start: "2026-07-04T00:00:00.000Z", status: "scheduled" },
  { id: "rm_2", customer: "Olivia Brennan", service: "Wedding-prep package", start: "2026-07-08T04:30:00.000Z", status: "scheduled" },
  { id: "rm_3", customer: "Maya Cole", service: "Dermal needling", start: "2026-07-03T06:00:00.000Z", status: "sent" },
];

const WINBACK: WinbackLead[] = [
  { id: "wb_1", name: "Hannah Lee", intent: "Asked about laser but didn't book", lastSeen: "2026-06-22T00:00:00.000Z", status: "pending" },
  { id: "wb_2", name: "Grace Miller", intent: "Priced injectables, went cold", lastSeen: "2026-06-19T00:00:00.000Z", status: "pending" },
  { id: "wb_3", name: "Tom Bradley", intent: "Wanted a Saturday facial", lastSeen: "2026-06-15T00:00:00.000Z", status: "sent" },
];

const UNANSWERED: UnansweredQuestion[] = [
  { id: "uq_1", question: "Do you offer student discounts?", count: 6, lastAsked: "2026-07-01T01:00:00.000Z", resolved: false },
  { id: "uq_2", question: "Is parking free on weekends?", count: 4, lastAsked: "2026-06-30T22:00:00.000Z", resolved: false },
  { id: "uq_3", question: "Do you treat rosacea?", count: 3, lastAsked: "2026-06-30T18:00:00.000Z", resolved: false },
];

async function scoped<T>(rows: T[]): Promise<T[]> {
  await getCurrentWorkspaceId();
  return USE_SUPABASE ? [] : [...rows];
}

export const getAbandonedEnquiries = () => scoped(ABANDONED);
export const getReviewRequests = () => scoped(REVIEWS);
export const getBookingReminders = () => scoped(REMINDERS);
export const getWinbackLeads = () => scoped(WINBACK);
export const getUnansweredQuestions = () => scoped(UNANSWERED);

/** Advance a growth item's status (mock persistence for the prototype). */
export function markGrowthItem(kind: string, id: string): void {
  if (kind === "abandoned") {
    const r = ABANDONED.find((x) => x.id === id);
    if (r) r.status = "sent";
  } else if (kind === "review") {
    const r = REVIEWS.find((x) => x.id === id);
    if (r && r.status === "pending") r.status = "sent";
  } else if (kind === "reminder") {
    const r = REMINDERS.find((x) => x.id === id);
    if (r && r.status === "scheduled") r.status = "sent";
  } else if (kind === "winback") {
    const r = WINBACK.find((x) => x.id === id);
    if (r) r.status = "sent";
  } else if (kind === "training") {
    const r = UNANSWERED.find((x) => x.id === id);
    if (r) r.resolved = true;
  }
}
