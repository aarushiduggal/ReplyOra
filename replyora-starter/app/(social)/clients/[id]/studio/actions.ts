"use server";

import { revalidatePath } from "next/cache";

import { createClientPost } from "@/lib/social/posts";
import {
  generatePostsSmart,
  type CaptionLength,
  type GeneratedPost,
  type Tone,
} from "@/lib/social/generate";
import {
  PILLAR_TOPICS,
  planMonth,
  toClockTimes,
  type Cadence,
  type PlannedSlot,
} from "@/lib/social/batch";
import { computeRecommendedTimes } from "@/lib/social/best-times";
import type { Platform, PostFormat } from "@/lib/social/types";

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

/** One planned post: its slot plus the caption written for it. */
export interface MonthDraft extends PlannedSlot {
  caption: string;
  hashtags: string[];
}

/**
 * Plan and write a whole month in one pass.
 *
 * Captions are generated PER PILLAR rather than per post: one call covering all
 * of that pillar's slots lets the model vary them against each other, and it
 * collapses ~13 API calls into ~4. Each pillar is independent, so one failure
 * degrades to template captions for that pillar instead of losing the month.
 */
export async function generateMonthAction(input: {
  clientId: string;
  businessName: string;
  industry: string;
  platform: Platform;
  year: number;
  month: number;
  cadence: Cadence;
  pillars: string[];
  tone: Tone;
  length: CaptionLength;
  voiceNotes?: string;
  /** ISO instant for "now" — passed in so the server and client agree. */
  nowIso: string;
  /**
   * The agency's UTC offset in minutes east, from the browser. Required for
   * correct wall-clock scheduling: this server runs in UTC.
   */
  tzOffsetMinutes: number;
}): Promise<MonthDraft[]> {
  // Real posting times for this account when Instagram is connected, else the
  // general defaults. Never let this fail the whole batch.
  const recommended = await computeRecommendedTimes(input.clientId).catch(
    () => ({ times: [] as string[], source: "general" as const }),
  );

  const slots = planMonth({
    year: input.year,
    month: input.month,
    cadence: input.cadence,
    pillars: input.pillars,
    platform: input.platform,
    // Recommended times arrive as labels ("Tue 7pm"); take the hours from them
    // and let the cadence own the weekday.
    times: toClockTimes(recommended.times),
    notBefore: input.nowIso,
    tzOffsetMinutes: input.tzOffsetMinutes,
  });
  if (slots.length === 0) return [];

  // Group the slots by pillar so each pillar is one generation call.
  const byPillar = new Map<string, PlannedSlot[]>();
  for (const s of slots) {
    const list = byPillar.get(s.pillar) ?? [];
    list.push(s);
    byPillar.set(s.pillar, list);
  }

  const written = await Promise.all(
    Array.from(byPillar.entries()).map(async ([pillar, group], pillarIndex) => {
      const posts = await generatePostsSmart({
        businessName: input.businessName,
        industry: input.industry,
        platform: input.platform,
        pillar,
        topic: PILLAR_TOPICS[pillar] ?? pillar.toLowerCase(),
        count: group.length,
        tone: input.tone,
        length: input.length,
        voiceNotes: input.voiceNotes,
        // Start each pillar at a different point in the template rotation, so
        // the first post of every pillar doesn't share one body line.
        variantOffset: pillarIndex * 2,
      }).catch(() => [] as GeneratedPost[]);

      return group.map((slot, i) => ({
        ...slot,
        caption: posts[i]?.caption ?? "",
        hashtags: posts[i]?.hashtags ?? [],
      }));
    }),
  );

  // Back into calendar order — the review UI reads as a month, not as pillars.
  return written.flat().sort((a, b) => a.index - b.index);
}

/**
 * Commit a reviewed month. Saves as scheduled posts with their dates, so they
 * land on the Calendar and Grid ready for approval. Empty captions are dropped
 * rather than saved blank.
 */
export async function saveMonthAction(
  clientId: string,
  drafts: MonthDraft[],
): Promise<{ saved: number }> {
  let saved = 0;
  for (const d of drafts) {
    const caption = d.caption.trim();
    if (!caption) continue;
    await createClientPost({
      clientId,
      platform: d.platform,
      pillar: d.pillar,
      topic: caption.slice(0, 80),
      caption,
      hashtags: d.hashtags,
      status: "scheduled",
      scheduledFor: d.scheduledFor,
      mediaUrl: null,
    });
    saved += 1;
  }
  revalidatePath(`/clients/${clientId}/studio`);
  revalidatePath(`/clients/${clientId}/grid`);
  revalidatePath(`/clients/${clientId}/calendar`);
  return { saved };
}

/** Save selected drafts to the client — they appear on Grid + Calendar. */
export async function saveDraftsAction(
  clientId: string,
  drafts: {
    caption: string;
    hashtags: string[];
    pillar: string;
    platform: Platform;
    format?: PostFormat;
    mediaUrl?: string | null;
    mediaKind?: "image" | "video" | null;
  }[],
): Promise<void> {
  for (const d of drafts) {
    await createClientPost({
      clientId,
      platform: d.platform,
      pillar: d.pillar,
      format: d.format,
      topic: d.caption.slice(0, 80),
      caption: d.caption,
      hashtags: d.hashtags,
      status: "draft",
      scheduledFor: null,
      mediaUrl: d.mediaUrl ?? null,
      mediaKind: d.mediaKind ?? null,
    });
  }
  revalidatePath(`/clients/${clientId}/studio`);
  revalidatePath(`/clients/${clientId}/grid`);
  revalidatePath(`/clients/${clientId}/calendar`);
}
