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

export interface GenerateInput {
  businessName: string;
  industry: string;
  platform: Platform;
  pillar: string;
  topic: string;
  /** How many variations to return (default 3). */
  count?: number;
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
  return set.slice(0, 6).map((t) => `#${t}`);
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

/** Body lines that carry the value. */
const BODIES: string[] = [
  "At {name}, we make {topic} simple, calm, and genuinely worth your time.",
  "Our team takes the stress out of {topic} so you can just show up and feel looked after.",
  "We've helped so many locals with {topic} — and we'd love to help you next.",
  "No jargon, no pressure — just {topic} done properly by people who care.",
];

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
  const hashtags = buildHashtags(input);

  const out: GeneratedPost[] = [];
  for (let i = 0; i < count; i++) {
    const hook = pick(hooks, i).replace("{topic}", topic).replace("{name}", name);
    const body = pick(BODIES, i + 1).replace("{topic}", topic).replace("{name}", name);
    const cta = pick(ctas, i);
    const caption = [hook, body, cta].map(clean).join("\n\n");
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
export async function generatePostsSmart(
  input: GenerateInput,
): Promise<GeneratedPost[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return generatePosts(input);

  const count = input.count ?? 3;
  const prompt = `You are a senior social media copywriter for a business${input.industry ? ` in the ${input.industry} industry` : ""} called "${input.businessName || "the brand"}".
Write ${count} distinct ${input.platform} captions about: ${input.topic || "the business"}.
Content pillar: ${input.pillar}. Voice: warm, human, confident, never salesy or generic. Each caption is 2-4 short lines with an emoji or two and one clear call to action.
Return ONLY valid JSON — an array of ${count} objects, each {"caption": string, "hashtags": string[]} with 5-8 relevant lowercase hashtags (each starting with #, no duplicates). No markdown, no commentary.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
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
      },
    );
    if (!res.ok) return generatePosts(input);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return generatePosts(input);

    const parsed = JSON.parse(text) as { caption?: string; hashtags?: string[] }[];
    const posts = parsed
      .filter((p) => p?.caption)
      .map((p) => ({
        caption: String(p.caption).trim(),
        hashtags: (p.hashtags ?? []).map((h) =>
          h.startsWith("#") ? h : `#${h.replace(/^#+/, "")}`,
        ),
      }));
    return posts.length > 0 ? posts : generatePosts(input);
  } catch {
    return generatePosts(input);
  }
}
