"use server";

import { revalidatePath } from "next/cache";

import { createClientPost } from "@/lib/social/posts";
import {
  generatePostsSmart,
  type CaptionLength,
  type GeneratedPost,
  type GenerationResult,
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
import {
  generateCarouselOutline,
  generateHooks,
  generateReelScript,
  generateReplyPack,
  generateStorySequence,
  type CarouselOutline,
  type HookSet,
  type ReelScript,
  type ReplyPack,
  type StorySequence,
  type ToolInput,
  type ToolResult,
} from "@/lib/social/formats";
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
}): Promise<GenerationResult> {
  // Returns the source too, so the UI can say whether real AI wrote these or
  // the built-in templates did. Silently returning either was how a wrong key
  // looked exactly like working AI.
  return generatePostsSmart(input);
}

/** One planned post: its slot plus the caption written for it. */
export interface MonthDraft extends PlannedSlot {
  caption: string;
  hashtags: string[];
}

/** A written month, plus what actually wrote it. */
export interface MonthPlan {
  drafts: MonthDraft[];
  source: "ai" | "template";
  reason?: string;
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
}): Promise<MonthPlan> {
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
  if (slots.length === 0) return { drafts: [], source: "template" };

  // Group the slots by pillar so each pillar is one generation call.
  const byPillar = new Map<string, PlannedSlot[]>();
  for (const s of slots) {
    const list = byPillar.get(s.pillar) ?? [];
    list.push(s);
    byPillar.set(s.pillar, list);
  }

  const written = await Promise.all(
    Array.from(byPillar.entries()).map(async ([pillar, group], pillarIndex) => {
      const result = await generatePostsSmart({
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
      }).catch(
        (err): GenerationResult => ({
          posts: [] as GeneratedPost[],
          source: "template",
          reason: err instanceof Error ? err.message : "generation failed",
        }),
      );

      return {
        result,
        drafts: group.map((slot, i) => ({
          ...slot,
          caption: result.posts[i]?.caption ?? "",
          hashtags: result.posts[i]?.hashtags ?? [],
        })),
      };
    }),
  );

  // If ANY pillar fell back, say so — a month that is half AI and half template
  // reads inconsistently, and the user should know which they got.
  const fellBack = written.find((w) => w.result.source === "template");

  // Back into calendar order — the review UI reads as a month, not as pillars.
  return {
    drafts: written.flatMap((w) => w.drafts).sort((a, b) => a.index - b.index),
    source: fellBack ? "template" : "ai",
    reason: fellBack?.result.reason,
  };
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

/* ── Format tools ─────────────────────────────────────────────────────── */

/** Write a short-form video script — hook, beats, on-screen text, CTA. */
export async function reelScriptAction(
  input: ToolInput,
): Promise<ToolResult<ReelScript>> {
  return generateReelScript(input);
}

/** Plan a carousel slide by slide. */
export async function carouselOutlineAction(
  input: ToolInput,
): Promise<ToolResult<CarouselOutline>> {
  return generateCarouselOutline(input);
}

/**
 * Save a planned carousel as a real draft post.
 *
 * The outline is copy, not media — the slides still need images attached in the
 * Grid. Saving it as a draft with the caption means the plan doesn't live in a
 * screenshot; it becomes the post you then drag photos onto.
 */
export async function saveCarouselDraftAction(
  clientId: string,
  input: {
    platform: Platform;
    pillar: string;
    caption: string;
    hashtags: string[];
    slideNotes: string;
  },
): Promise<void> {
  await createClientPost({
    clientId,
    platform: input.platform,
    pillar: input.pillar,
    format: "carousel",
    topic: input.caption.slice(0, 80),
    // The slide plan rides along in the caption so it's in front of whoever
    // builds the post, rather than lost in a tab they closed.
    caption: `${input.caption}\n\n— slides —\n${input.slideNotes}`,
    hashtags: input.hashtags,
    status: "draft",
    scheduledFor: null,
    mediaUrl: null,
  });
  revalidatePath(`/clients/${clientId}/studio`);
  revalidatePath(`/clients/${clientId}/grid`);
}

/** Eight alternative opening lines for an existing caption. */
export async function hooksAction(input: ToolInput): Promise<ToolResult<HookSet>> {
  return generateHooks(input);
}

/** Plan a Story sequence — frames, text and stickers. */
export async function storySequenceAction(
  input: ToolInput,
): Promise<ToolResult<StorySequence>> {
  return generateStorySequence(input);
}

/** Ready replies for the comments a client actually gets. */
export async function replyPackAction(
  input: ToolInput,
): Promise<ToolResult<ReplyPack>> {
  return generateReplyPack(input);
}
