"use server";

import { revalidatePath } from "next/cache";

import { decidePortalApproval, verifyShareToken } from "@/lib/social/portal";

/** Public (token-authorised) client decision on a post. */
export async function decideAction(
  token: string,
  postId: string,
  status: "approved" | "changes",
  note: string,
): Promise<{ ok: boolean }> {
  const clientId = verifyShareToken(token);
  if (!clientId) return { ok: false };
  const ok = await decidePortalApproval(clientId, postId, status, note);
  revalidatePath(`/portal/${token}`);
  return { ok };
}
