import type { Plan, PlanStatus } from "@/lib/data/types";
import type { StaffRole } from "@/lib/admin/access";

/**
 * Mock "fleet" of client workspaces for the staff portal (local/demo mode).
 * In live mode the client list comes from the real `workspaces` table via the
 * service role; these seeds power the local prototype. "Today" is 2026-07-01.
 */

export type SetupStatus = "pending" | "in_progress" | "live";

export interface AdminClient {
  id: string; // workspace id
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  plan: Plan;
  status: PlanStatus;
  paused: boolean;
  messagesUsed: number;
  kbPagesUsed: number;
  signupAt: string;
  lastActiveAt: string;
  setupStatus: SetupStatus;
  setupFeePaid: boolean;
  trialEndsAt: string | null;
  unansweredCount: number;
  notes: string;
}

export const ADMIN_CLIENTS: AdminClient[] = [
  {
    id: "ws_demo",
    name: "Coastal Glow Skin Clinic",
    slug: "coastal-glow",
    ownerName: "Amara Nguyen",
    ownerEmail: "amara@coastalglow.com.au",
    plan: "growth",
    status: "active",
    paused: false,
    messagesUsed: 2140,
    kbPagesUsed: 42,
    signupAt: "2026-05-12T09:00:00.000Z",
    lastActiveAt: "2026-07-01T02:15:00.000Z",
    setupStatus: "live",
    setupFeePaid: true,
    trialEndsAt: null,
    unansweredCount: 3,
    notes: "Flagship reference client. Very engaged, quick to reply.",
  },
  {
    id: "ws_northside",
    name: "Northside Physio",
    slug: "northside-physio",
    ownerName: "Dr. Sam Whitfield",
    ownerEmail: "sam@northsidephysio.com.au",
    plan: "pro",
    status: "active",
    paused: false,
    messagesUsed: 14820,
    kbPagesUsed: 310,
    signupAt: "2026-03-02T09:00:00.000Z",
    lastActiveAt: "2026-06-30T23:40:00.000Z",
    setupStatus: "live",
    setupFeePaid: true,
    trialEndsAt: null,
    unansweredCount: 6,
    notes: "High volume. Wants rebate FAQs kept current.",
  },
  {
    id: "ws_bloom",
    name: "Bloom Hair Studio",
    slug: "bloom-hair",
    ownerName: "Bianca Rossi",
    ownerEmail: "bianca@bloomhair.com.au",
    plan: "starter",
    status: "active",
    paused: false,
    messagesUsed: 640,
    kbPagesUsed: 8,
    signupAt: "2026-06-04T09:00:00.000Z",
    lastActiveAt: "2026-06-29T21:10:00.000Z",
    setupStatus: "live",
    setupFeePaid: true,
    trialEndsAt: null,
    unansweredCount: 2,
    notes: "Requested a price-list update (billable $25 extra).",
  },
  {
    id: "ws_harbour",
    name: "Harbour Dental",
    slug: "harbour-dental",
    ownerName: "Priya Shah",
    ownerEmail: "priya@harbourdental.com.au",
    plan: "growth",
    status: "trialing",
    paused: false,
    messagesUsed: 90,
    kbPagesUsed: 12,
    signupAt: "2026-06-27T09:00:00.000Z",
    lastActiveAt: "2026-06-30T08:00:00.000Z",
    setupStatus: "in_progress",
    setupFeePaid: false,
    trialEndsAt: "2026-07-04T09:00:00.000Z",
    unansweredCount: 1,
    notes: "Trial ends in 3 days. Setup half done — booking not connected yet.",
  },
  {
    id: "ws_peak",
    name: "Peak Plumbing & Gas",
    slug: "peak-plumbing",
    ownerName: "Mitch Callahan",
    ownerEmail: "mitch@peakplumbing.com.au",
    plan: "pro",
    status: "past_due",
    paused: false,
    messagesUsed: 9300,
    kbPagesUsed: 180,
    signupAt: "2026-04-18T09:00:00.000Z",
    lastActiveAt: "2026-06-28T17:22:00.000Z",
    setupStatus: "live",
    setupFeePaid: true,
    trialEndsAt: null,
    unansweredCount: 5,
    notes: "Card declined on last renewal — dunning in progress.",
  },
  {
    id: "ws_zen",
    name: "Zen Day Spa",
    slug: "zen-day-spa",
    ownerName: "Lena Torres",
    ownerEmail: "lena@zendayspa.com.au",
    plan: "growth",
    status: "active",
    paused: false,
    messagesUsed: 5210,
    kbPagesUsed: 96,
    signupAt: "2026-05-25T09:00:00.000Z",
    lastActiveAt: "2026-07-01T01:05:00.000Z",
    setupStatus: "live",
    setupFeePaid: true,
    trialEndsAt: null,
    unansweredCount: 11,
    notes: "OVER message cap (5,210 / 5,000). Assistant asking a lot it can't answer — needs retraining.",
  },
  {
    id: "ws_newleaf",
    name: "New Leaf NDIS Supports",
    slug: "new-leaf-ndis",
    ownerName: "Grace Okonkwo",
    ownerEmail: "grace@newleafndis.com.au",
    plan: "none",
    status: "trialing",
    paused: false,
    messagesUsed: 12,
    kbPagesUsed: 2,
    signupAt: "2026-06-30T09:00:00.000Z",
    lastActiveAt: "2026-06-30T12:00:00.000Z",
    setupStatus: "pending",
    setupFeePaid: false,
    trialEndsAt: "2026-07-07T09:00:00.000Z",
    unansweredCount: 0,
    notes: "New signup — awaiting done-for-you setup kickoff.",
  },
];

// ---------- Onboarding pipeline ----------
export interface OnboardingTask {
  key: string;
  label: string;
  done: boolean;
}
export interface OnboardingRecord {
  clientId: string;
  tasks: OnboardingTask[];
}

const ONBOARDING_STEPS = [
  { key: "build", label: "Build assistant" },
  { key: "train", label: "Train on their info" },
  { key: "booking", label: "Add booking" },
  { key: "install", label: "Install snippet" },
  { key: "golive", label: "Go live" },
];

function onboarding(clientId: string, doneCount: number): OnboardingRecord {
  return {
    clientId,
    tasks: ONBOARDING_STEPS.map((s, i) => ({ ...s, done: i < doneCount })),
  };
}

export const ADMIN_ONBOARDING: OnboardingRecord[] = [
  onboarding("ws_harbour", 3),
  onboarding("ws_newleaf", 0),
];

// ---------- Update / retrain queue ----------
export type TicketType = "starter_extra" | "growth_refresh" | "pro_request";
export type TicketStatus = "open" | "in_progress" | "done";
export interface ServiceTicket {
  id: string;
  clientId: string;
  type: TicketType;
  title: string;
  status: TicketStatus;
  feeAud: number | null;
  createdAt: string;
}

export const ADMIN_TICKETS: ServiceTicket[] = [
  {
    id: "tk_1",
    clientId: "ws_bloom",
    type: "starter_extra",
    title: "Update winter price list + new balayage packages",
    status: "open",
    feeAud: 25,
    createdAt: "2026-06-28T00:00:00.000Z",
  },
  {
    id: "tk_2",
    clientId: "ws_demo",
    type: "growth_refresh",
    title: "90-day proactive refresh — new laser packages",
    status: "in_progress",
    feeAud: null,
    createdAt: "2026-06-25T00:00:00.000Z",
  },
  {
    id: "tk_3",
    clientId: "ws_northside",
    type: "pro_request",
    title: "Add updated private-health rebate table",
    status: "open",
    feeAud: null,
    createdAt: "2026-06-30T00:00:00.000Z",
  },
  {
    id: "tk_4",
    clientId: "ws_zen",
    type: "growth_refresh",
    title: "Retrain — assistant missing new treatment menu",
    status: "open",
    feeAud: null,
    createdAt: "2026-06-30T00:00:00.000Z",
  },
];

// ---------- Performance-call scheduler ----------
export type CallStatus = "due" | "scheduled" | "done";
export interface PerformanceCall {
  id: string;
  clientId: string;
  cadenceDays: number; // Growth 90, Pro 60
  dueAt: string;
  status: CallStatus;
  notes: string;
}

export const ADMIN_CALLS: PerformanceCall[] = [
  {
    id: "call_1",
    clientId: "ws_northside",
    cadenceDays: 60,
    dueAt: "2026-07-02T00:00:00.000Z",
    status: "due",
    notes: "",
  },
  {
    id: "call_2",
    clientId: "ws_demo",
    cadenceDays: 90,
    dueAt: "2026-07-05T00:00:00.000Z",
    status: "scheduled",
    notes: "Booked Fri 3pm — review booking conversion.",
  },
  {
    id: "call_3",
    clientId: "ws_peak",
    cadenceDays: 60,
    dueAt: "2026-06-20T00:00:00.000Z",
    status: "due",
    notes: "Overdue — also chase failed payment.",
  },
];

// ---------- Billing / invoices ----------
export type InvoiceStatus = "paid" | "failed" | "upcoming";
export interface Invoice {
  id: string;
  clientId: string;
  description: string;
  amountAud: number;
  status: InvoiceStatus;
  date: string;
}

export const ADMIN_INVOICES: Invoice[] = [
  { id: "in_1", clientId: "ws_demo", description: "Growth — June", amountAud: 300, status: "paid", date: "2026-06-12T00:00:00.000Z" },
  { id: "in_2", clientId: "ws_demo", description: "Setup & training (one-time)", amountAud: 250, status: "paid", date: "2026-05-12T00:00:00.000Z" },
  { id: "in_3", clientId: "ws_northside", description: "Pro — June", amountAud: 390, status: "paid", date: "2026-06-02T00:00:00.000Z" },
  { id: "in_4", clientId: "ws_bloom", description: "Starter — June", amountAud: 250, status: "paid", date: "2026-06-04T00:00:00.000Z" },
  { id: "in_5", clientId: "ws_peak", description: "Pro — June (declined)", amountAud: 390, status: "failed", date: "2026-06-18T00:00:00.000Z" },
  { id: "in_6", clientId: "ws_zen", description: "Growth — June", amountAud: 300, status: "paid", date: "2026-06-25T00:00:00.000Z" },
  { id: "in_7", clientId: "ws_harbour", description: "Growth + setup (on trial end)", amountAud: 550, status: "upcoming", date: "2026-07-04T00:00:00.000Z" },
];

// ---------- Assistant quality / knowledge gaps ----------
export interface KnowledgeGap {
  clientId: string;
  question: string;
  count: number;
  lastAsked: string;
}

export const ADMIN_KNOWLEDGE_GAPS: KnowledgeGap[] = [
  { clientId: "ws_zen", question: "Do you do couples massage packages?", count: 7, lastAsked: "2026-07-01T00:10:00.000Z" },
  { clientId: "ws_zen", question: "Are gift vouchers refundable?", count: 4, lastAsked: "2026-06-30T22:00:00.000Z" },
  { clientId: "ws_northside", question: "Do you bulk-bill under a care plan?", count: 5, lastAsked: "2026-06-30T20:00:00.000Z" },
  { clientId: "ws_peak", question: "Do you do emergency callouts on Sundays?", count: 5, lastAsked: "2026-06-28T09:00:00.000Z" },
  { clientId: "ws_demo", question: "Do you offer afterpay on injectables?", count: 3, lastAsked: "2026-06-29T14:00:00.000Z" },
];

// ---------- Broadcasts ----------
export interface Broadcast {
  id: string;
  subject: string;
  body: string;
  audience: string;
  sentAt: string;
}

export const ADMIN_BROADCASTS: Broadcast[] = [
  {
    id: "bc_1",
    subject: "New: connect your Google Calendar for bookings",
    body: "You can now point Replyora at your Google Calendar or Calendly for live availability.",
    audience: "All clients",
    sentAt: "2026-06-20T00:00:00.000Z",
  },
];

// ---------- Staff (platform_admins) ----------
export interface StaffMember {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
  createdAt: string;
}

export const ADMIN_STAFF: StaffMember[] = [
  { userId: "user_demo_owner", name: "Aarushi", email: "aarushi@replyora.com", role: "superadmin", createdAt: "2026-05-01T00:00:00.000Z" },
  { userId: "staff_2", name: "Jordan Lee", email: "jordan@replyora.com", role: "staff", createdAt: "2026-06-10T00:00:00.000Z" },
];
