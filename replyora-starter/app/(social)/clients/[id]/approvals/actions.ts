"use server";

import { revalidatePath } from "next/cache";

import { sendForApproval } from "@/lib/social/approvals";

/** Agency sends a post to the client's review portal (status → pending). */
export async function sendForReviewAction(
  clientId: string,
  postId: string,
): Promise<void> {
  await sendForApproval(postId);
  revalidatePath(`/clients/${clientId}/approvals`);
  revalidatePath(`/clients/${clientId}/calendar`);
}
