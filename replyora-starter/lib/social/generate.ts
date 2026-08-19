import type { Platform } from "./types";

/**
 * ReplyOra Social — content generator.
 *
 * Zero-cost by default: this composes on-brand captions locally with no API
 * call and no key, so it runs free forever. It's structured as a single
 * `generatePosts()` seam so you can later swap in a real LLM WITHOUT touching
 * the UI or actions.
 *
 * ⤷ REAL AI, STILL FREE: both Google Gemini (gemini-1.5-flash) and Groq
 *   (llama-3.x) have free API tiers. Add the key to the env and replace the
 *   body of generatePosts() with a fetch to that endpoint, returning the same
 *   GeneratedPost[] shape. Nothing else changes.
 */

/**
 * Voice controls. These matter most when batching a month: without them a
 * dozen captions generated in one pass all sound like the same sentence.
 */
export type Tone = "warm" | "expert" | "playful" | "direct" | "luxe";
export type CaptionLength = "short" | "medium" | "long";

export const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "warm", label: "Warm", hint: "friendly, human, a little soft" },
  { value: "expert", label: "Expert", hint: "calm authority, informative" },
  { value: "playful", label: "Playful", hint: "light, cheeky, emoji-forward" },
  { value: "direct", label: "Direct", hint: "short sentences, no fluff" },
  { value: "luxe", label: "Luxe", hint: "editorial, understated, premium" },
];

export const CAPTION_LENGTHS: { value: CaptionLength; label: string }[] = [
  { value: "short", label: "Short · 1–2 lines" },
  { value: "medium", label: "Medium · 2–4 lines" },
  { value: "long", label: "Long · 4–6 lines" },
];

export interface GenerateInput {
  businessName: string;
  industry: string;
  platform: Platform;
  pillar: string;
  topic: string;
  /** How many variations to return (default 3). */
  count?: number;
  /** Voice controls — all optional so every existing caller keeps working. */
  tone?: Tone;
  length?: CaptionLength;
  /** How many hashtags to return (default 6). */
  hashtagCount?: number;
  /** Free-text brand voice notes for this client, fed straight to the model. */
  voiceNotes?: string;
  /**
   * Shifts which template lines this batch starts from. Without it, every
   * pillar in a month batch begins at the same index and so opens with the
   * identical body line — very obvious across 13 posts.
   */
  variantOffset?: number;
}

export interface GeneratedPost {
  caption: string;
  hashtags: string[];
}

/** Collapse runs of spaces/tabs but KEEP line breaks (captions want them). */
function clean(s: string): string {
  return s.replace(/[ \t]+/g, " ").trim();
}

function slug(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Build a small, relevant hashtag set from the inputs. */
function buildHashtags(input: GenerateInput): string[] {
  const base = [
    slug(input.businessName),
    slug(input.industry),
    ...input.topic.split(/\s+/).slice(0, 3).map(slug),
    slug(input.pillar),
  ].filter((t) => t.length > 2);

  const platformTag =
    input.platform === "instagram" ? "instagood" : "fyp";
  const set = Array.from(new Set([...base, platformTag]));
  return set.slice(0, input.hashtagCount ?? 6).map((t) => `#${t}`);
}

/**
 * Opening hooks by pillar. `{topic}` and `{name}` get filled in.
 */
const HOOKS: Record<string, string[]> = {
  Educational: [
    "Here's something most people get wrong about {topic}:",
    "Quick myth-bust on {topic} 👇",
    "If you've ever wondered about {topic}, read this.",
  ],
  Promotion: [
    "This is your sign to book in for {topic}.",
    "{name} is now taking bookings for {topic} — spots are limited.",
    "Ready to sort out {topic}? We've got you.",
  ],
  Testimonial: [
    "“I wish I'd come in sooner.” — a note about {topic}.",
    "Real results, real people. Here's what {topic} looked like.",
    "Nothing beats hearing this after {topic} 💬",
  ],
  "Behind the scenes": [
    "A little look behind the scenes at {name} 👀",
    "Ever wondered how we handle {topic}? Come backstage.",
    "This is what a normal day of {topic} actually looks like.",
  ],
  Tips: [
    "3 quick tips for {topic} you can use today 👇",
    "Save this if {topic} is on your mind.",
    "Small change, big difference — here's a tip on {topic}.",
  ],
  Offer: [
    "For a limited time: {topic}.",
    "We don't do this often — {topic}, this week only.",
    "Treat yourself (or someone you love): {topic}.",
  ],
};

/** Body lines that carry the value, per tone. */
const TONE_BODIES: Record<Tone, string[]> = {
  warm: [
    "At {name}, we make {topic} simple, calm, and genuinely worth your time.",
    "Our team takes the stress out of {topic} so you can just show up and feel looked after.",
    "We've helped so many locals with {topic} — and we'd love to help you next.",
    "No jargon, no pressure — just {topic} done properly by people who care.",
  ],
  expert: [
    "{topic} is worth getting right, and the details are where most people slip.",
    "Here's how we approach {topic} at {name} — and why it holds up.",
    "Years of {topic} have taught us what actually works, and what only sounds good.",
    "We'd rather explain {topic} properly than sell you the short version.",
  ],
  playful: [
    "{topic}? Consider it handled ✨",
    "We may be a little obsessed with {topic}. No regrets.",
    "Come for {topic}, stay because we're delightful. Obviously.",
    "{name} does {topic} so you don't have to think about it again 🙌",
  ],
  direct: [
    "{topic}, done properly. That's it.",
    "You need {topic}. We do {topic}. Simple.",
    "No fuss. No upsell. Just {topic}.",
    "Book {topic} at {name}. We'll take it from there.",
  ],
  luxe: [
    "{topic}, considered down to the last detail.",
    "At {name}, {topic} is unhurried, precise, and quietly excellent.",
    "There is a right way to do {topic}. This is it.",
    "{topic} — refined, and worth the wait.",
  ],
};

/** Calls-to-action by platform (tone differs). */
const CTAS: Record<Platform, string[]> = {
  instagram: [
    "Tap the link in bio to book, or DM us “HELLO” and we'll sort it. 💛",
    "Comment “ME” and we'll send the details straight to your DMs.",
    "Save this post and send us a message when you're ready — we reply fast.",
  ],
  tiktok: [
    "Follow for more and drop a comment — we reply to every one.",
    "Link in bio to book. Don't overthink it 😌",
    "Comment your question below and we'll make a video answering it.",
  ],
  facebook: [
    "Send us a message to book — we usually reply within the hour. 💛",
    "Tap “Book Now” or comment below and we'll take care of the rest.",
    "Share this with a friend who needs it, and message us to get started.",
  ],
};

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]!;
}

/**
 * Generate `count` on-brand caption variations for the given inputs.
 * Deterministic-ish per index so "Regenerate" produces different takes.
 */
export function generatePosts(input: GenerateInput): GeneratedPost[] {
  const count = input.count ?? 3;
  const name = input.businessName || "our team";
  const topic = input.topic.trim() || "what we do";
  const hooks = HOOKS[input.pillar] ?? HOOKS.Educational!;
  const ctas = CTAS[input.platform];
  const bodies = TONE_BODIES[input.tone ?? "warm"];
  const hashtags = buildHashtags(input);
  const length = input.length ?? "medium";

  const fill = (s: string) =>
    s.replace("{topic}", topic).replace("{name}", name);

  const offset = input.variantOffset ?? 0;

  const out: GeneratedPost[] = [];
  for (let i = 0; i < count; i++) {
    const n = i + offset;
    const hook = fill(pick(hooks, n));
    const cta = pick(ctas, n);

    // Length controls how much sits between the hook and the call to action.
    // The body index is offset differently from the hook so the two patterns
    // don't march in lockstep across a long batch.
    const middle =
      length === "short"
        ? []
        : length === "long"
          ? [fill(pick(bodies, n + 1)), fill(pick(bodies, n + 3))]
          : [fill(pick(bodies, n + 1))];

    const caption = [hook, ...middle, cta].map(clean).join("\n\n");
    out.push({ caption, hashtags });
  }
  return out;
}

/**
 * Real caption generation via Google Gemini (free tier), with the local
 * template generator (generatePosts) as an automatic fallback. Costs nothing:
 * activates only when GEMINI_API_KEY is set, and any error/timeout/missing key
 * silently falls back to the deterministic templates — so it always returns.
 *
 * Dependency-free (fetch). responseMimeType forces valid JSON back from Gemini.
 */
/** What actually wrote the captions, so callers can tell the user. */
/** Pinned here so upgrading the model is one line, not a buried string. */
const MODEL = "gemini-2.0-flash";

export interface GenerationResult {
  posts: GeneratedPost[];
  source: "ai" | "template";
  /** Why AI was skipped or failed. Present whenever source === "template". */
  reason?: string;
}

/**
 * Real caption generation via Google Gemini (free tier), falling back to the
 * local template generator.
 *
 * Every fallback is REPORTED, not swallowed. This previously returned templates
 * silently on a missing key, an HTTP error, an empty response or bad JSON — so
 * a wrong key or a deprecated model looked identical to working AI, just with
 * duller copy. That is the same silent-failure shape that hid media_kind and
 * the /clients crash, and it is the one thing that makes a fallback dangerous
 * rather than safe.
 */
/**
 * Pull the readable sentence out of a Google API error body.
 *
 * The raw body is nested JSON ({"error":{"code":400,"message":"API key not
 * valid. Please pass a valid API key.",...}}). That message is exactly what the
 * user needs to fix the problem; the rest is noise in a toast.
 */
function geminiErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    const msg = parsed.error?.message;
    if (msg) return msg;
  } catch {
    // Not JSON — fall through and show the raw body instead.
  }
  return body.slice(0, 200);
}

export async function generatePostsSmart(
  input: GenerateInput,
): Promise<GenerationResult> {
  const template = (reason: string): GenerationResult => {
    if (reason !== "no key") console.error(`[generate] falling back to templates: ${reason}`);
    return { posts: generatePosts(input), source: "template", reason };
  };

  const key = process.env.GEMINI_API_KEY;
  if (!key) return template("no key");

  const count = input.count ?? 3;
  const tone = TONES.find((t) => t.value === (input.tone ?? "warm"));
  const lines =
    input.length === "short"
      ? "1-2 short lines"
      : input.length === "long"
        ? "4-6 short lines"
        : "2-4 short lines";
  const tags = input.hashtagCount ?? 6;

  const prompt = `You are a senior social media copywriter for a business${input.industry ? ` in the ${input.industry} industry` : ""} called "${input.businessName || "the brand"}".
Write ${count} distinct ${input.platform} captions about: ${input.topic || "the business"}.
Content pillar: ${input.pillar}.
Voice: ${tone?.label ?? "Warm"} — ${tone?.hint ?? "friendly, human"}. Human and confident, never salesy or generic.
Each caption is ${lines} with one clear call to action.${
    input.voiceNotes?.trim()
      ? `\nBrand voice notes to follow closely: ${input.voiceNotes.trim()}`
      : ""
  }
Make the ${count} captions genuinely different from each other — vary the opening line, the structure and the angle. Do not reuse the same hook pattern twice.
Return ONLY valid JSON — an array of ${count} objects, each {"caption": string, "hashtags": string[]} with ${tags} relevant lowercase hashtags (each starting with #, no duplicates). No markdown, no commentary.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!res.ok) {
      // Google's body says WHY — bad key, model not found, quota. Keep it.
      const detail = await res.text().catch(() => "");
      return template(geminiErrorMessage(detail) || `Gemini HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return template("Gemini returned no text (often a safety block)");

    let parsed: { caption?: string; hashtags?: string[] }[];
    try {
      parsed = JSON.parse(text) as { caption?: string; hashtags?: string[] }[];
    } catch {
      return template("Gemini returned unparseable JSON");
    }

    const posts = parsed
      .filter((p) => p?.caption)
      .map((p) => ({
        caption: String(p.caption).trim(),
        hashtags: (p.hashtags ?? []).map((h) =>
          h.startsWith("#") ? h : `#${h.replace(/^#+/, "")}`,
        ),
      }));
    if (posts.length === 0) return template("Gemini returned no usable captions");

    return { posts, source: "ai" };
  } catch (err) {
    return template(err instanceof Error ? err.message : "Gemini request failed");
  }
}

