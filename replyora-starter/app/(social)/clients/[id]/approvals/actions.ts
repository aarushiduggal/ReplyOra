"use server";

import { revalidatePath } from "next/cache";

import {
  sendForApproval,
  respondToChangeRequest,
  type ChangeResolution,
} from "@/lib/social/approvals";

/** Agency sends a post to the client's review portal (status → pending). */
export async function sendForReviewAction(
  clientId: string,
  postId: string,
): Promise<void> {
  await sendForApproval(postId);
  revalidatePath(`/clients/${clientId}/approvals`);
  revalidatePath(`/clients/${clientId}/calendar`);
}

/** Agency replies to a change request and/or sets its resolution state. */
export async function respondToChangeAction(
  clientId: string,
  postId: string,
  input: { reply?: string; resolution?: ChangeResolution },
): Promise<void> {
  await respondToChangeRequest(postId, input);
  revalidatePath(`/clients/${clientId}/approvals`);
}
