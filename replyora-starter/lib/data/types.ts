/**
 * Domain types for the mock data layer.
 *
 * These mirror the database schema in supabase/migrations/0001_init.sql so that
 * swapping the mock functions for real Supabase queries is a drop-in change.
 * When the real DB lands, prefer the generated `types/db.ts` Row types; these
 * stay as the app-facing shape.
 */

export type Plan = "none" | "starter" | "growth" | "pro";
export type PlanStatus = "trialing" | "active" | "past_due" | "canceled";
export type MemberRole = "owner" | "admin" | "member";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: Plan;
  planStatus: PlanStatus;
  /** When the free trial ends (ISO). null = no trial window (e.g. paid). */
  trialEndsAt: string | null;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  fullName: string;
  role: MemberRole;
  createdAt: string;
}

export interface BusinessHours {
  /** key = mon|tue|wed|thu|fri|sat|sun */
  [day: string]: { open: string; close: string; closed?: boolean };
}

export interface BusinessProfile {
  workspaceId: string;
  industry: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  hours: BusinessHours;
  timezone: string;
}

export type KnowledgeType =
  | "text"
  | "faq"
  | "file"
  | "url"
  | "pricing"
  | "service";
export type KnowledgeStatus = "pending" | "processing" | "ready" | "failed";

export interface KnowledgeSource {
  id: string;
  workspaceId: string;
  type: KnowledgeType;
  title: string;
  /** short preview of the captured content, for the list UI */
  preview: string;
  status: KnowledgeStatus;
  error: string | null;
  /** size in bytes, for file sources / the plan size meter */
  sizeBytes: number;
  createdAt: string;
}

export interface LeadField {
  key: string;
  label: string;
  required: boolean;
}

export interface Assistant {
  id: string;
  workspaceId: string;
  publicKey: string;
  name: string;
  tone: "friendly" | "professional" | "playful" | "concise";
  model: string;
  temperature: number;
  brandColor: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
  leadFields: LeadField[];
  allowedDomains: string[];
  status: "active" | "paused";
  /** Owner preference to hide "Powered by Replyora" (only applies on Growth+). */
  removeBranding?: boolean;
}

export type ConversationStatus = "open" | "closed";

/** Whether the AI or a human teammate is currently driving the conversation. */
export type HandledBy = "assistant" | "human";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  /** For business-side messages: was it the AI or a human teammate? */
  author?: "ai" | "human";
  content: string;
  createdAt: string;
}

export interface ConversationNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  visitorId: string;
  pageUrl: string;
  status: ConversationStatus;
  handledBy: HandledBy;
  /** denormalised for the list view */
  preview: string;
  messageCount: number;
  capturedLead: boolean;
  startedAt: string;
  lastMessageAt: string;
  messages: ConversationMessage[];
  notes: ConversationNote[];
}

export type LeadStatus = "new" | "qualified" | "booked" | "lost";
/** Qualification temperature. */
export type LeadScore = "hot" | "warm" | "cold";

export interface LeadQualification {
  service: string | null;
  urgency: string | null;
  suburb: string | null;
  budget: string | null;
}

export interface Lead {
  id: string;
  workspaceId: string;
  conversationId: string | null;
  name: string;
  email: string;
  phone: string;
  intent: string;
  status: LeadStatus;
  score: LeadScore;
  /** 0-100 numeric score backing the hot/warm/cold band. */
  scoreValue: number;
  qualification: LeadQualification;
  createdAt: string;
}

export interface UsageCounter {
  workspaceId: string;
  periodStart: string;
  messagesUsed: number;
  leadsCount: number;
}

// ---------- Bookings ----------
export type BookingStatus = "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  workspaceId: string;
  leadId: string | null;
  conversationId: string | null;
  customerName: string;
  customerEmail: string;
  service: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  status: BookingStatus;
  createdAt: string;
}

export interface TimeSlot {
  start: string; // ISO
  label: string; // e.g. "Sat 5 Jul · 10:00 am"
}

// ---------- Notifications ----------
export type NotificationType = "lead" | "booking" | "handoff" | "followup";

export interface NotificationItem {
  id: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

// ---------- Follow-up automation ----------
export interface FollowupRule {
  enabled: boolean;
  /** trigger when a lead stays in this status past the delay */
  targetStatus: LeadStatus;
  delayHours: number;
  message: string;
}

// ---------- Niche templates (onboarding quick-start) ----------
export interface NicheTemplate {
  id: string;
  name: string;
  industry: string;
  emoji: string;
  blurb: string;
  persona: { name: string; tone: Assistant["tone"]; welcome: string };
  suggestedQuestions: string[];
  knowledge: { title: string; preview: string }[];
}
