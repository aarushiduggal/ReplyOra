import "server-only";

import type { Platform } from "@/lib/social/types";
import type { Tone } from "@/lib/social/generate";

/**
 * Studio's format tools — the jobs that aren't "write me a caption".
 *
 * A reel needs a structure (hook, beats, on-screen text, CTA) and a carousel
 * needs slide-by-slide copy. Both were previously impossible in Studio, which
 * only ever produced a paragraph, so the TikTok shelf and the carousel editor
 * had nothing feeding them.
 *
 * Same contract as generatePostsSmart: real AI when GEMINI_API_KEY is set,
 * a usable template otherwise, and the source is always reported so the UI can
 * say which one you got.
 */

const MODEL = "gemini-2.0-flash";

export type ToolSource = "ai" | "template";

export interface ReelBeat {
  /** "0-2s", "2-5s" — roughly when this lands. */
  at: string;
  /** What happens on screen. */
  action: string;
  /** Text burned onto the frame. Short — it has to be readable at a glance. */
  onScreen: string;
}

export interface ReelScript {
  hook: string;
  beats: ReelBeat[];
  cta: string;
  caption: string;
  hashtags: string[];
}

export interface CarouselSlide {
  headline: string;
  body: string;
}

export interface CarouselOutline {
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
}

export interface ToolResult<T> {
  data: T;
  source: ToolSource;
  reason?: string;
}

export interface ToolInput {
  businessName: string;
  platform: Platform;
  pillar: string;
  topic: string;
  tone?: Tone;
  voiceNotes?: string;
  /** Carousel only — how many slides to plan. */
  slides?: number;
  /** Hook rewriter only — the caption whose opening line needs work. */
  caption?: string;
}

/** Pull the readable sentence out of a Google API error body. */
function geminiError(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not JSON */
  }
  return body.slice(0, 180);
}

/** One Gemini round trip returning parsed JSON, or null with a reason. */
async function askGemini(
  prompt: string,
): Promise<{ json: unknown } | { error: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { error: "no key" };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { error: geminiError(body) || `Gemini HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { error: "Gemini returned no text (often a safety block)" };
    try {
      return { json: JSON.parse(text) };
    } catch {
      return { error: "Gemini returned unparseable JSON" };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gemini request failed" };
  }
}

function tagsFor(topic: string, business: string): string[] {
  const base = [business, topic]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4)
    .map((w) => `#${w}`);
  return Array.from(new Set([...base, "#smallbusiness", "#behindthescenes"]));
}

// ── Reel / TikTok script ───────────────────────────────────────────────────

function reelTemplate(input: ToolInput): ReelScript {
  const t = input.topic || "what we do";
  const b = input.businessName || "us";
  return {
    hook: `Nobody tells you this about ${t}.`,
    beats: [
      { at: "0–2s", action: "Straight to camera, no intro", onScreen: `The truth about ${t}` },
      { at: "2–6s", action: "Cut to the thing itself, close up", onScreen: "Here's what actually matters" },
      { at: "6–12s", action: "Show the before and the after side by side", onScreen: "The difference" },
      { at: "12–18s", action: "Back to camera for the point", onScreen: `Why we do it this way at ${b}` },
    ],
    cta: "Save this for next time — and send it to the friend who needs it.",
    caption: `The bit about ${t} nobody explains. Save this one.`,
    hashtags: tagsFor(t, b),
  };
}

export async function generateReelScript(
  input: ToolInput,
): Promise<ToolResult<ReelScript>> {
  const fall = (reason: string): ToolResult<ReelScript> => {
    if (reason !== "no key") console.error(`[formats] reel fell back: ${reason}`);
    return { data: reelTemplate(input), source: "template", reason };
  };

  const prompt = `You are a short-form video producer writing a ${input.platform} script for "${input.businessName || "the brand"}".
Topic: ${input.topic || "the business"}. Content pillar: ${input.pillar}.
Tone: ${input.tone ?? "warm"}, human, never corporate.${
    input.voiceNotes?.trim() ? `\nBrand voice notes: ${input.voiceNotes.trim()}` : ""
  }
Write a 15-25 second script with a hook that earns the first two seconds, 3-5 beats, and a call to action.
On-screen text must be SHORT — six words at most, readable at a glance.
Return ONLY valid JSON: {"hook": string, "beats": [{"at": string, "action": string, "onScreen": string}], "cta": string, "caption": string, "hashtags": string[]}. Six lowercase hashtags starting with #. No markdown.`;

  const res = await askGemini(prompt);
  if ("error" in res) return fall(res.error);

  const j = res.json as Partial<ReelScript>;
  const beats = Array.isArray(j.beats) ? j.beats.filter((b) => b?.action) : [];
  if (!j.hook || beats.length === 0) return fall("Gemini returned an empty script");

  return {
    data: {
      hook: String(j.hook),
      beats: beats.slice(0, 6).map((b) => ({
        at: String(b.at ?? ""),
        action: String(b.action ?? ""),
        onScreen: String(b.onScreen ?? ""),
      })),
      cta: String(j.cta ?? ""),
      caption: String(j.caption ?? ""),
      hashtags: Array.isArray(j.hashtags) ? j.hashtags.map(String).slice(0, 8) : [],
    },
    source: "ai",
  };
}

// ── Carousel outline ───────────────────────────────────────────────────────

function carouselTemplate(input: ToolInput): CarouselOutline {
  const n = Math.min(10, Math.max(3, input.slides ?? 6));
  const t = input.topic || "what we do";
  const b = input.businessName || "us";
  const middles = [
    ["Start here", "The one thing most people skip, and why it matters more than the rest."],
    ["The mistake", "What we see go wrong most often — and the quick way to avoid it."],
    ["Do this instead", "A small change you can make today that shows up immediately."],
    ["The proof", "What it looks like when it's done properly."],
    ["Keep it going", "The habit that makes the result last longer than a week."],
    ["Worth knowing", "One more thing nobody mentions until you ask."],
    ["Our take", `How we approach this at ${b}, and why.`],
    ["Quick recap", "The whole thing in one line, so it sticks."],
  ];
  const middleSlides: CarouselSlide[] = middles
    .slice(0, n - 2)
    .map(([headline, body]) => ({ headline: headline!, body: body! }));

  return {
    slides: [
      { headline: `${t}, explained`, body: "Swipe — this takes about thirty seconds." },
      ...middleSlides,
      { headline: "Save this", body: `Follow ${b} for more like it.` },
    ],
    caption: `Everything you need to know about ${t}. Swipe through and save it.`,
    hashtags: tagsFor(t, b),
  };
}

export async function generateCarouselOutline(
  input: ToolInput,
): Promise<ToolResult<CarouselOutline>> {
  const n = Math.min(10, Math.max(3, input.slides ?? 6));
  const fall = (reason: string): ToolResult<CarouselOutline> => {
    if (reason !== "no key") console.error(`[formats] carousel fell back: ${reason}`);
    return { data: carouselTemplate(input), source: "template", reason };
  };

  const prompt = `You are a social media strategist writing an Instagram carousel for "${input.businessName || "the brand"}".
Topic: ${input.topic || "the business"}. Content pillar: ${input.pillar}.
Tone: ${input.tone ?? "warm"}, human, never corporate.${
    input.voiceNotes?.trim() ? `\nBrand voice notes: ${input.voiceNotes.trim()}` : ""
  }
Write exactly ${n} slides. Slide 1 must stop the scroll. The last slide asks for a save or a follow.
Headlines are 6 words or fewer. Bodies are one or two short sentences — this is text on an image, not an essay.
Return ONLY valid JSON: {"slides": [{"headline": string, "body": string}], "caption": string, "hashtags": string[]}. Six lowercase hashtags starting with #. No markdown.`;

  const res = await askGemini(prompt);
  if ("error" in res) return fall(res.error);

  const j = res.json as Partial<CarouselOutline>;
  const slides = Array.isArray(j.slides) ? j.slides.filter((s) => s?.headline) : [];
  if (slides.length === 0) return fall("Gemini returned no slides");

  return {
    data: {
      slides: slides.slice(0, 10).map((s) => ({
        headline: String(s.headline ?? ""),
        body: String(s.body ?? ""),
      })),
      caption: String(j.caption ?? ""),
      hashtags: Array.isArray(j.hashtags) ? j.hashtags.map(String).slice(0, 8) : [],
    },
    source: "ai",
  };
}


// ── Hook rewriter ──────────────────────────────────────────────────────────

export interface HookSet {
  hooks: string[];
}

function hookTemplate(input: ToolInput): HookSet {
  const t = input.topic || input.caption?.split(/[.!?]/)[0] || "this";
  return {
    hooks: [
      `Nobody tells you this about ${t}.`,
      `We get asked about ${t} every single week.`,
      `The mistake almost everyone makes with ${t}:`,
      `If you only remember one thing about ${t}, make it this.`,
      `Stop doing this with ${t}.`,
      `Here's what ${t} actually looks like up close.`,
      `Three years in, this is what we've learned about ${t}.`,
      `${t.charAt(0).toUpperCase()}${t.slice(1)} — the honest version.`,
    ],
  };
}

/**
 * Eight alternative opening lines for a caption.
 *
 * The first line decides whether the rest gets read at all, and it's the part
 * people rewrite most. Regenerating a whole caption to fix one line loses
 * everything that was already good.
 */
export async function generateHooks(
  input: ToolInput,
): Promise<ToolResult<HookSet>> {
  const fall = (reason: string): ToolResult<HookSet> => {
    if (reason !== "no key") console.error(`[formats] hooks fell back: ${reason}`);
    return { data: hookTemplate(input), source: "template", reason };
  };

  const prompt = `You are a social media copywriter for "${input.businessName || "the brand"}".
Here is a caption:
"""
${input.caption?.trim() || input.topic}
"""
Write 8 alternative OPENING LINES for it. Keep the caption's subject and voice — you are only replacing the first line.
Tone: ${input.tone ?? "warm"}. Each hook is one line, under 12 words, and makes someone stop scrolling.
Vary the shape: a question, a bold claim, a mistake, a number, a confession, a direct address. No two the same pattern. No emoji.
Return ONLY valid JSON: {"hooks": string[]}. No markdown.`;

  const res = await askGemini(prompt);
  if ("error" in res) return fall(res.error);
  const j = res.json as Partial<HookSet>;
  const hooks = Array.isArray(j.hooks) ? j.hooks.map(String).filter(Boolean) : [];
  if (hooks.length === 0) return fall("Gemini returned no hooks");
  return { data: { hooks: hooks.slice(0, 10) }, source: "ai" };
}

// ── Story sequence ─────────────────────────────────────────────────────────

export interface StoryFrame {
  visual: string;
  text: string;
  /** Poll, question or quiz prompt. Empty when the frame has no sticker. */
  sticker: string;
}

export interface StorySequence {
  frames: StoryFrame[];
}

function storyTemplate(input: ToolInput): StorySequence {
  const t = input.topic || "today";
  const b = input.businessName || "us";
  return {
    frames: [
      { visual: "Open on the space or the product, no text for a beat", text: `A quick one about ${t}`, sticker: "" },
      { visual: "Close up on the detail that makes the point", text: "This is the bit that matters", sticker: "" },
      { visual: "Show the result", text: "And this is why", sticker: "Poll: worth it / not for me" },
      { visual: "Back to camera", text: `Questions? Ask us anything about ${t}`, sticker: "Question box: ask us anything" },
      { visual: `${b} logo or storefront`, text: "Link in bio to book", sticker: "" },
    ],
  };
}

/**
 * A story sequence — frames, not a caption.
 *
 * Stories are the format Studio ignored entirely, and they're where most
 * agencies spend their daily effort. Each frame carries what to show, the text
 * on it, and any sticker, because a story is a sequence rather than a post.
 */
export async function generateStorySequence(
  input: ToolInput,
): Promise<ToolResult<StorySequence>> {
  const fall = (reason: string): ToolResult<StorySequence> => {
    if (reason !== "no key") console.error(`[formats] story fell back: ${reason}`);
    return { data: storyTemplate(input), source: "template", reason };
  };

  const prompt = `You are a social media manager planning an Instagram Story sequence for "${input.businessName || "the brand"}".
Topic: ${input.topic || "the business"}. Content pillar: ${input.pillar}.
Tone: ${input.tone ?? "warm"}.${
    input.voiceNotes?.trim() ? `\nBrand voice notes: ${input.voiceNotes.trim()}` : ""
  }
Plan 4-5 frames. Each frame: what to film or show, the text on screen (under 8 words — it's a phone screen), and a sticker if one fits (poll, question box or quiz). Most frames should have no sticker.
The last frame asks for one clear action.
Return ONLY valid JSON: {"frames": [{"visual": string, "text": string, "sticker": string}]}. Use an empty string for no sticker. No markdown.`;

  const res = await askGemini(prompt);
  if ("error" in res) return fall(res.error);
  const j = res.json as Partial<StorySequence>;
  const frames = Array.isArray(j.frames) ? j.frames.filter((f) => f?.text || f?.visual) : [];
  if (frames.length === 0) return fall("Gemini returned no frames");
  return {
    data: {
      frames: frames.slice(0, 6).map((f) => ({
        visual: String(f.visual ?? ""),
        text: String(f.text ?? ""),
        sticker: String(f.sticker ?? ""),
      })),
    },
    source: "ai",
  };
}

// ── Reply pack ─────────────────────────────────────────────────────────────

export interface ReplyPack {
  replies: { scenario: string; reply: string }[];
}

const SCENARIOS = [
  "Asks the price",
  "Asks if you're taking bookings",
  "Leaves a compliment",
  "Asks where you are",
  "Unhappy with something",
  "Asks a technical question",
];

function replyTemplate(input: ToolInput): ReplyPack {
  const b = input.businessName || "us";
  return {
    replies: [
      { scenario: SCENARIOS[0]!, reply: "Great question — it depends on the length and what you're after. Send us a DM and we'll give you an exact number." },
      { scenario: SCENARIOS[1]!, reply: "We are! Booking link is in our bio, and if nothing suits just message us and we'll find you a time." },
      { scenario: SCENARIOS[2]!, reply: "Thank you — that genuinely made our day. 🤍" },
      { scenario: SCENARIOS[3]!, reply: `We're easy to find — full address is in our bio, and there's parking right out front.` },
      { scenario: SCENARIOS[4]!, reply: "We're really sorry to hear that, and we'd like to fix it. Could you DM us so we can sort it properly?" },
      { scenario: SCENARIOS[5]!, reply: `Happy to explain — send us a DM and one of the team at ${b} will talk you through it.` },
    ],
  };
}

/**
 * Ready replies for the comments a client actually gets.
 *
 * Answering comments is billable agency work that nobody has tooling for, and
 * it's where a client's voice slips most — it's done fast, on a phone, by
 * whoever is free.
 */
export async function generateReplyPack(
  input: ToolInput,
): Promise<ToolResult<ReplyPack>> {
  const fall = (reason: string): ToolResult<ReplyPack> => {
    if (reason !== "no key") console.error(`[formats] replies fell back: ${reason}`);
    return { data: replyTemplate(input), source: "template", reason };
  };

  const prompt = `You are replying to Instagram comments as "${input.businessName || "the brand"}"${
    input.topic ? `, a business that does: ${input.topic}` : ""
  }.
Tone: ${input.tone ?? "warm"} — sound like a person, never like a support macro.${
    input.voiceNotes?.trim() ? `\nBrand voice notes: ${input.voiceNotes.trim()}` : ""
  }
Write one reply for each of these situations: ${SCENARIOS.join("; ")}.
Each reply is 1-2 sentences. Never promise a specific price or date. For the unhappy one, take it to DMs without being defensive.
Return ONLY valid JSON: {"replies": [{"scenario": string, "reply": string}]}. No markdown.`;

  const res = await askGemini(prompt);
  if ("error" in res) return fall(res.error);
  const j = res.json as Partial<ReplyPack>;
  const replies = Array.isArray(j.replies) ? j.replies.filter((r) => r?.reply) : [];
  if (replies.length === 0) return fall("Gemini returned no replies");
  return {
    data: {
      replies: replies.slice(0, 8).map((r) => ({
        scenario: String(r.scenario ?? ""),
        reply: String(r.reply ?? ""),
      })),
    },
    source: "ai",
  };
}
