"use server";

import { revalidatePath } from "next/cache";

import {
  createClientPost,
  updateClientPost,
  deleteClientPost,
} from "@/lib/social/posts";
import { sendForApproval } from "@/lib/social/approvals";
import type { Platform, PostStatus } from "@/lib/social/types";

function revalidate(clientId: string) {
  revalidatePath(`/clients/${clientId}/calendar`);
  revalidatePath(`/clients/${clientId}/grid`);
  revalidatePath(`/clients/${clientId}/approvals`);
}

export async function createCalendarPostAction(
  clientId: string,
  input: {
    caption: string;
    pillar: string;
    platform: Platform;
    scheduledFor: string | null;
  },
): Promise<void> {
  await createClientPost({
    clientId,
    caption: input.caption,
    pillar: input.pillar,
    platform: input.platform,
    topic: input.caption.slice(0, 80),
    scheduledFor: input.scheduledFor,
    status: input.scheduledFor ? "scheduled" : "draft",
  });
  revalidate(clientId);
}

export async function updateCalendarPostAction(
  clientId: string,
  id: string,
  patch: {
    caption?: string;
    pillar?: string;
    platform?: Platform;
    status?: PostStatus;
    scheduledFor?: string | null;
  },
): Promise<void> {
  await updateClientPost(id, patch);
  revalidate(clientId);
}

export async function deleteCalendarPostAction(
  clientId: string,
  id: string,
): Promise<void> {
  await deleteClientPost(id);
  revalidate(clientId);
}

export async function sendForApprovalAction(
  clientId: string,
  postId: string,
): Promise<void> {
  await sendForApproval(postId);
  revalidate(clientId);
}
