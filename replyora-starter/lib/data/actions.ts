"use server";

/**
 * Server Actions — the write boundary callable from Client Components.
 * These run on the server, so they can safely use the server Supabase client
 * (which imports next/headers). Client components import from here instead of
 * importing the accessor modules directly (which would pull server-only code
 * into the client bundle).
 */

import { updateLeadStatus as _updateLeadStatus } from "./leads";
import { createBooking as _createBooking, type NewBooking } from "./bookings";
import {
  updateBookingConfig as _updateBookingConfig,
  type BookingConfig,
} from "./booking-config";
import { updateBusinessProfile as _updateBusinessProfile } from "./business-profile";
import {
  createKnowledgeSource as _createKnowledgeSource,
  deleteKnowledgeSource as _deleteKnowledgeSource,
  KnowledgeLimitError,
  type NewKnowledgeSource,
} from "./knowledge";
import { updateAssistant as _updateAssistant } from "./assistant";
import {
  addConversationNote as _addConversationNote,
  addHumanMessage as _addHumanMessage,
  convertConversationToLead as _convertConversationToLead,
  setHandledBy as _setHandledBy,
} from "./conversations";
import { notifyOwner } from "./notifications";
import type { ConversationMessage } from "./types";
import { getImpersonation } from "@/lib/admin/access";
import type {
  Assistant,
  Booking,
  BusinessProfile,
  Conversation,
  ConversationNote,
  HandledBy,
  KnowledgeSource,
  Lead,
  LeadStatus,
} from "./types";

/**
 * Block writes while a staff member is in read-only "View as" impersonation.
 * "Manage" (edit) impersonation and normal client sessions are unaffected.
 */
async function assertWritable(): Promise<void> {
  const imp = await getImpersonation();
  if (imp?.mode === "view") {
    throw new Error(
      "Read-only: you're viewing as this client. Switch to Manage to make changes.",
    );
  }
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<Lead | null> {
  await assertWritable();
  return _updateLeadStatus(id, status);
}

export async function createBooking(input: NewBooking): Promise<Booking> {
  await assertWritable();
  const booking = await _createBooking(input);
  // Advance the linked lead to "booked" so the pipeline reflects the win.
  if (input.leadId) {
    await _updateLeadStatus(input.leadId, "booked");
  }
  // Fire the owner notification through the seam (in-app + best-effort email).
  const when = new Date(booking.start).toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  await notifyOwner({
    type: "booking",
    title: `New booking — ${booking.customerName}`,
    body: `${booking.service}, ${when}.`,
    href: "/dashboard/bookings",
  });
  return booking;
}

export async function updateBookingConfig(
  patch: Partial<BookingConfig>,
): Promise<BookingConfig> {
  await assertWritable();
  return _updateBookingConfig(patch);
}

export async function updateBusinessProfile(
  patch: Partial<BusinessProfile>,
): Promise<BusinessProfile> {
  await assertWritable();
  return _updateBusinessProfile(patch);
}

export type CreateKnowledgeResult =
  | { ok: true; source: KnowledgeSource }
  | { ok: false; error: string };

export async function createKnowledgeSource(
  input: NewKnowledgeSource,
): Promise<CreateKnowledgeResult> {
  try {
    await assertWritable();
    const source = await _createKnowledgeSource(input);
    return { ok: true, source };
  } catch (e) {
    if (e instanceof KnowledgeLimitError) return { ok: false, error: e.message };
    return { ok: false, error: "Couldn't add that source. Please try again." };
  }
}

export async function deleteKnowledgeSource(id: string): Promise<void> {
  await assertWritable();
  return _deleteKnowledgeSource(id);
}

export async function updateAssistant(
  patch: Partial<Assistant>,
): Promise<Assistant> {
  await assertWritable();
  return _updateAssistant(patch);
}

export async function setHandledBy(
  id: string,
  handledBy: HandledBy,
): Promise<void> {
  await assertWritable();
  return _setHandledBy(id, handledBy);
}

export async function sendHumanReply(
  id: string,
  text: string,
): Promise<ConversationMessage> {
  await assertWritable();
  return _addHumanMessage(id, text);
}

export async function addConversationNote(
  id: string,
  author: string,
  body: string,
): Promise<ConversationNote> {
  await assertWritable();
  return _addConversationNote(id, author, body);
}

export async function convertConversationToLead(
  conversation: Conversation,
  fields: { name: string; email: string; phone: string; intent: string },
): Promise<Lead> {
  await assertWritable();
  return _convertConversationToLead(conversation, fields);
}
