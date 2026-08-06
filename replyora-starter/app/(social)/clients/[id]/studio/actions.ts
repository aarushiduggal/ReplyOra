"use server";

import { revalidatePath } from "next/cache";

import { createClientPost } from "@/lib/social/posts";
import { generatePostsSmart, type GeneratedPost } from "@/lib/social/generate";
import type { Platform } from "@/lib/social/types";

/**
 * Generate caption variations for a batch. Uses Gemini (free tier) when
 * GEMINI_API_KEY is set, else the local template generator — no cost either way.
 */
export async function generateDraftsAction(input: {
  businessName: string;
  industry: string;
  platform: Platform;
  pillar: string;
  topic: string;
  count: number;
}): Promise<GeneratedPost[]> {
  return generatePostsSmart(input);
}

/** Save selected drafts to the client — they appear on Grid + Calendar. */
export async function saveDraftsAction(
  clientId: string,
  drafts: {
    caption: string;
    hashtags: string[];
    pillar: string;
    platform: Platform;
    mediaUrl?: string | null;
  }[],
): Promise<void> {
  for (const d of drafts) {
    await createClientPost({
      clientId,
      platform: d.platform,
      pillar: d.pillar,
      topic: d.caption.slice(0, 80),
      caption: d.caption,
      hashtags: d.hashtags,
      status: "draft",
      scheduledFor: null,
      mediaUrl: d.mediaUrl ?? null,
    });
  }
  revalidatePath(`/clients/${clientId}/studio`);
  revalidatePath(`/clients/${clientId}/grid`);
  revalidatePath(`/clients/${clientId}/calendar`);
}
