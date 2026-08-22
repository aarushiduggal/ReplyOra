"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/owner";
import { USE_AUTHJS, USE_SUPABASE } from "@/lib/data/mode";
import { logAdminAudit } from "@/lib/admin/social-data";
import { createInvite, createInvites, revokeInvite } from "@/lib/beta";
import { markInvited, setWaitlistStatus } from "@/lib/waitlist";
import { sendEmail } from "@/lib/email";

/**
 * Staff actions for running the closed beta.
 *
 * Every one re-checks staff access. The /admin layout gates the pages, but a
 * server action is its own HTTP endpoint — anyone who knows its id can POST to
 * it directly, so the layout's check does not protect these.
 */
async function requireStaff(): Promise<{ email: string }> {
  const user = await getCurrentUser();
  const mock =
    !USE_AUTHJS && !USE_SUPABASE && process.env.NODE_ENV !== "production";
  if (!mock && !isStaff(user.email)) throw new Error("forbidden");
  return { email: user.email };
}

function inviteUrl(code: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://replyora.net").replace(
    /\/+$/,
    "",
  );
  return `${base}/join/${code}`;
}

export interface InviteResult {
  code: string;
  url: string;
  emailed: boolean;
  emailReason?: string;
}

/**
 * Invite someone from the waitlist: mint a code locked to their email, mark the
 * row, and email them the link if a mail provider is configured.
 *
 * Returns the link either way, so you can always paste it into a DM yourself —
 * most of these people came from Instagram, not email.
 */
export async function inviteFromWaitlistAction(
  email: string,
  name?: string | null,
): Promise<InviteResult> {
  const staff = await requireStaff();
  const addr = email.trim().toLowerCase();
  if (!addr) throw new Error("no email");

  const invite = await createInvite({
    label: name?.trim() || addr,
    email: addr,
    createdBy: staff.email,
  });
  const url = inviteUrl(invite.code);
  await markInvited(addr, invite.code);

  const sent = await sendEmail({
    to: addr,
    subject: "Your Replyora beta invite",
    text: [
      `Hi${name ? ` ${name}` : ""},`,
      "",
      "You're in. Here's your invite link to the Replyora beta:",
      "",
      url,
      "",
      "It works once, and it's tied to this email address.",
      "",
      "You get the full product free for 30 days — no card. In return, tell us",
      "what's annoying, broken, or missing. That's the whole reason you're here.",
      "",
      "— Replyora",
    ].join("\n"),
  });

  await logAdminAudit({
    actorEmail: staff.email,
    action: `beta invite issued to ${addr}`,
  });
  revalidatePath("/admin/waitlist");
  return {
    code: invite.code,
    url,
    emailed: sent.sent,
    emailReason: sent.reason,
  };
}

/** Mint unassigned invite links — for DMs, where you have no email yet. */
export async function createInvitesAction(count: number): Promise<InviteResult[]> {
  const staff = await requireStaff();
  const made = await createInvites(count, staff.email);
  await logAdminAudit({
    actorEmail: staff.email,
    action: `generated ${made.length} beta invite link(s)`,
  });
  revalidatePath("/admin/waitlist");
  return made.map((i) => ({
    code: i.code,
    url: inviteUrl(i.code),
    emailed: false,
  }));
}

export async function revokeInviteAction(code: string): Promise<void> {
  const staff = await requireStaff();
  await revokeInvite(code);
  await logAdminAudit({
    actorEmail: staff.email,
    action: `revoked beta invite ${code}`,
  });
  revalidatePath("/admin/waitlist");
}

export async function setWaitlistStatusAction(
  email: string,
  status: "new" | "invited" | "declined",
): Promise<void> {
  await requireStaff();
  await setWaitlistStatus(email, status);
  revalidatePath("/admin/waitlist");
}
