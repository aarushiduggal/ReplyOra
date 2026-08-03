import { DEMO_ASSISTANT } from "@/lib/data/seed";

/**
 * Canned "RAG" reply generator for the prototype demo widget.
 *
 * This is a scripted placeholder, NOT real AI: it keyword-scores against a
 * small demo KB and handles a range of conversational moves (contact capture,
 * affirmatives, greetings, thanks, hand-off, intent fallbacks) so the demo feels
 * alive and rarely dead-ends. The real implementation calls Claude with
 * retrieved knowledge — see lib/ai/llm.ts (wired when ANTHROPIC_API_KEY is set).
 */

interface CannedAnswer {
  keywords: string[];
  text: string;
}

const ANSWERS: CannedAnswer[] = [
  {
    keywords: ["hydrafacial", "facial", "glow"],
    text: "Our signature HydraFacial is $189 and takes about 45–60 minutes — a cleanse, gentle exfoliation, painless extractions and a hydrating serum infusion, with zero downtime. We also do an Express Facial at $99. Would you like me to take your details so the team can find you a time?",
  },
  {
    keywords: ["laser", "hair removal"],
    text: "We offer laser hair removal across the body — small areas start from $79, and larger areas like full legs are quoted at your first session after a quick patch test. Most clients book a course of 6 for the best result. I can arrange a free laser consult — shall I grab your name and mobile?",
  },
  {
    keywords: ["needling", "scar", "collagen", "texture", "wrinkle", "fine lines"],
    text: "Dermal needling is $299 and stimulates collagen to improve texture, scarring and fine lines, with just a day or two of mild redness. If you tell me your main skin goal, I can suggest whether needling or a HydraFacial suits you best.",
  },
  {
    keywords: ["injectable", "botox", "filler", "anti-wrinkle", "nurse"],
    text: "Cosmetic injectables are done by our registered nurse after a quick consult so everything's tailored and safe. Consults are complimentary. Would you like me to take your details and have the nurse reach out with times?",
  },
  {
    keywords: ["price", "pricing", "cost", "how much", "rate", "fee", "charge"],
    text: "Here's a quick guide: HydraFacial $189 · Express facial $99 · Dermal needling $299 · Laser (small area) from $79 · Skin consultation $50 (redeemable on your first treatment). Want me to recommend something for your skin goals?",
  },
  {
    keywords: ["service", "services", "treatment", "treatments", "offer", "menu"],
    text: "We offer HydraFacials, dermal needling, LED therapy, laser hair removal, cosmetic injectables and skin-health consultations — all tailored to your skin goals. What are you hoping to work on? I can point you to the right treatment.",
  },
  {
    keywords: ["open", "hours", "saturday", "sunday", "weekend", "today", "tomorrow", "time"],
    text: "We're open Mon–Fri from 9am, with late nights Wed & Thu until 8pm, Saturdays 9am–4pm, and we're closed Sundays. Would you like help finding a time that works for you?",
  },
  {
    keywords: ["where", "located", "location", "address", "parking", "manly", "directions", "near"],
    text: "You'll find us at Shop 4, 22 The Corso, Manly — right in the heart of the pedestrian mall. The closest parking is the Whistler Street car park, about a 4-minute walk. Were you hoping to come in for a treatment or a consult?",
  },
  {
    keywords: ["book", "booking", "appointment", "consult", "available", "availability", "slot", "reschedule"],
    text: "I'd love to help you book! I can't see live availability here, but if you share your name and the best email or mobile, our front desk will reach out with times that suit you.",
  },
  {
    keywords: ["cancel", "cancellation", "refund", "no show"],
    text: "No problem — we just ask for 24 hours' notice to cancel or reschedule so we can offer the spot to someone else. Injectable appointments have a small deposit. Would you like me to help you find a new time instead?",
  },
  {
    keywords: ["payment", "afterpay", "zip", "finance", "deposit", "instalment"],
    text: "We offer Afterpay and Zip on most treatments, including cosmetic injectables (a nurse consult is required first). Would you like me to take your details for a consult?",
  },
  {
    keywords: ["patch test", "downtime", "recovery", "safe", "hurt", "pain"],
    text: "Most of our treatments have little to no downtime — a HydraFacial has none, and needling means a day or two of mild redness. For laser and injectables we do a quick patch test or consult first so it's safe and comfortable. Want me to book you a consult?",
  },
];

// Answers for Replyora's own assistant (dogfooded on the marketing site).
const REPLYORA_ANSWERS: CannedAnswer[] = [
  {
    keywords: ["trial", "free", "card", "credit card"],
    text: "You get a 7-day free trial — no credit card to start. After that, plans are $250 (Starter), $300 (Growth) or $390 (Pro) per month, plus a one-time $250 done-for-you setup & training fee on your first invoice. Cancel anytime.",
  },
  {
    keywords: ["difference", "compare", "starter", "growth", "pro"],
    text: "Starter ($250) covers instant AI replies and lead capture. Growth ($300) adds booking, human handoff, remove-branding and abandoned-enquiry recovery. Pro ($390) adds continuous retraining, a review engine, no-show reduction and AI lead win-back. Most owners start on Growth — want a hand choosing?",
  },
  {
    keywords: ["price", "pricing", "cost", "how much", "plan", "plans", "expensive"],
    text: "Plans are Starter $250, Growth $300 (most popular) and Pro $390 per month, with ~20% off annually. There's a one-time $250 setup & training fee. Every plan includes real AI answers, lead capture, booking and qualification. Want me to help you pick one?",
  },
  {
    keywords: ["install", "embed", "website", "widget", "code", "wordpress", "wix", "squarespace"],
    text: "Replyora is a chat widget you add to your website with a single line of code — it works on WordPress, Wix, Squarespace, Shopify or a custom site. It lives on your site and answers, captures and books 24/7. Want me to show you how the install works?",
  },
  {
    keywords: ["ai", "claude", "smart", "answer", "answers"],
    text: "Every plan uses real AI to answer from your own content — your FAQs, services and pricing — so replies sound like you, not a generic bot. Pro adds continuous retraining that keeps it sharper over time. Want to see it trained on your business?",
  },
  {
    keywords: ["demo", "call", "walkthrough"],
    text: "I'd love to set you up with a demo! You can book a 20-minute walkthrough on our Book a demo page — or share your name and email here and the team will reach out.",
  },
  {
    keywords: ["book", "booking", "appointment", "calendar", "calendly"],
    text: "Yes — Replyora has a native pick-a-time booking flow built from your opening hours, plus a Calendly/Google Calendar seam. Bookings advance the lead to 'booked' and show on your dashboard. Booking is included from the Growth plan up.",
  },
  {
    keywords: ["secure", "security", "data", "safe", "privacy", "gdpr"],
    text: "Every workspace is isolated with row-level security, data is encrypted, and we never use one business's data to answer another's. You can export or delete your data anytime.",
  },
  {
    keywords: ["cancel", "contract", "lock", "commitment", "refund"],
    text: "No lock-in — you can cancel anytime from your billing settings. We also back the $250 setup fee with a 30-day guarantee: if it's not for you, we'll refund it.",
  },
  {
    keywords: ["industry", "physio", "salon", "ndis", "dentist", "gym", "law", "cafe", "business"],
    text: "Replyora is built for local service businesses — physio clinics, salons, dentists, gyms, law firms, cafés, real estate and NDIS providers all have quick-start templates. Tell me your industry and I'll point you to the right one!",
  },
];

const CLINIC_FALLBACKS = [
  "Good question! I'll have one of our team follow up so you get the right answer. Could I grab your name and the best email or mobile?",
  "I want to make sure you get the right info, so I'll get a team member to help. What's your name and the best number to reach you on?",
  "Happy to help with that! So the right person can get back to you, could you share your name and email or mobile?",
];

const REPLYORA_FALLBACKS = [
  "Good question! I can get someone from the team to walk you through it. What's your name and best email?",
  "Let me get that answered properly for you — could you share your name and email, or book a quick demo?",
  "Happy to help! Drop your name and email and the team will follow up, or you can book a demo anytime.",
];

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+?\d[\d\s-]{7,}\d)/;
const AFFIRMATIVES = new Set([
  "yes",
  "yeah",
  "yep",
  "yup",
  "sure",
  "ok",
  "okay",
  "yes please",
  "please",
  "sounds good",
  "go on",
  "definitely",
  "that works",
  "perfect",
]);
const GREETINGS = new Set([
  "hi",
  "hello",
  "hey",
  "hiya",
  "good morning",
  "good afternoon",
  "gday",
  "g'day",
  "howdy",
  "yo",
]);
const THANKS = new Set([
  "thanks",
  "thank you",
  "thankyou",
  "ta",
  "cheers",
  "thanks so much",
  "much appreciated",
  "appreciate it",
]);
const FAREWELLS = new Set([
  "bye",
  "goodbye",
  "see you",
  "see ya",
  "cya",
  "later",
  "that's all",
  "thats all",
  "no thanks",
  "nothing else",
]);

// Words too common to be useful for scoring an intent match.
const STOP = new Set([
  "the", "a", "an", "and", "or", "do", "you", "i", "is", "for", "how", "much",
  "can", "to", "my", "me", "of", "on", "at", "it", "this", "that", "what",
  "are", "with", "in", "your", "get", "have", "does", "any", "we", "us",
  "please", "would", "could", "there", "about", "when", "will", "be",
]);

function looksLikeContact(msg: string): boolean {
  return (
    EMAIL_RE.test(msg) ||
    PHONE_RE.test(msg) ||
    /[a-z].*[-–—]\s*\+?\d/i.test(msg) // "Name - 0444..."
  );
}

function extractName(msg: string): string | null {
  const beforeSep = msg.split(/[-–—,]/)[0]?.trim() ?? "";
  if (
    beforeSep &&
    beforeSep.length <= 40 &&
    /[a-z]/i.test(beforeSep) &&
    !EMAIL_RE.test(beforeSep) &&
    !/\d{3,}/.test(beforeSep) &&
    /^[A-Za-z][A-Za-z.'\- ]{1,38}$/.test(beforeSep)
  ) {
    return beforeSep;
  }
  return null;
}

/** Score a message against a KB and return the best-matching answer (or null). */
function bestMatch(text: string, set: CannedAnswer[]): CannedAnswer | null {
  const tokens = new Set(
    text
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP.has(w)),
  );
  let best: CannedAnswer | null = null;
  let bestScore = 0;
  for (const a of set) {
    let score = 0;
    for (const k of a.keywords) {
      // Multi-word keyword → phrase match; single word → token match.
      if (k.includes(" ")) {
        if (text.includes(k)) score += 2;
      } else if (tokens.has(k)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return bestScore > 0 ? best : null;
}

/**
 * Resolve a reply for a visitor message.
 * Order: contact capture → thanks/farewell → affirmative → greeting → scored KB
 * match → intent fallback (pricing/booking) → varied generic fallback. This
 * keeps the demo from repeating itself or dead-ending on off-topic questions.
 */
export function generateMockReply(
  message: string,
  assistantName: string = DEMO_ASSISTANT.name,
): string {
  const isReplyora = assistantName.toLowerCase().includes("replyora");
  const text = message.toLowerCase().trim();
  const normalized = text.replace(/[!.?]/g, "").trim();

  // 1) Visitor shared their contact details → confirm capture (don't re-ask).
  if (looksLikeContact(message)) {
    const name = extractName(message);
    const hi = name ? `Thanks ${name}! ` : "Perfect, thank you! ";
    return isReplyora
      ? `${hi}I've passed your details to the Replyora team and they'll reach out shortly. Anything else you'd like to know in the meantime?`
      : `${hi}I've noted your details and our team will be in touch very soon to lock in a time. Anything else I can help you with in the meantime? ✨`;
  }

  // 2) Thanks / farewell → warm close (don't re-pitch).
  if (THANKS.has(normalized)) {
    return isReplyora
      ? "You're very welcome! 🙌 Anything else you'd like to know about Replyora?"
      : "You're so welcome! 💛 Is there anything else I can help you with?";
  }
  if (FAREWELLS.has(normalized)) {
    return isReplyora
      ? "Thanks for stopping by! Whenever you're ready, you can start a free trial or book a demo. Have a great day. 👋"
      : "Thanks for chatting! We're here whenever you need us — have a lovely day. 👋";
  }

  // 3) Short "yes"-style reply → move forward instead of repeating.
  if (AFFIRMATIVES.has(normalized)) {
    return isReplyora
      ? "Great! What's your name and the best email to reach you, and I'll get the team to follow up?"
      : "Wonderful! Could you share your name and the best mobile or email, and our team will reach out with the details?";
  }

  // 4) Greeting.
  if (GREETINGS.has(normalized)) {
    return isReplyora
      ? "Hi there! 👋 Ask me anything about Replyora — pricing, the free trial, how the website widget works, or booking a demo."
      : "Hi! 👋 Ask me about our treatments, pricing or availability — or I can help you book a consult.";
  }

  // 5) Scored keyword match against the demo knowledge base.
  const set = isReplyora ? REPLYORA_ANSWERS : ANSWERS;
  const match = bestMatch(text, set);
  if (match) return match.text;

  // 6) Intent fallback — pricing / booking phrasing we didn't KB-match.
  if (/price|cost|how much|\$|fee|rate|charge|afford/.test(text)) {
    return set.find((a) => a.keywords.includes("price"))?.text ?? set[0]!.text;
  }
  if (/book|appointment|avail|slot|when|today|tomorrow|weekend|schedule/.test(text)) {
    return set.find((a) => a.keywords.includes("book"))?.text ?? set[0]!.text;
  }

  // 7) Varied fallback (never the exact same line for different messages).
  const pool = isReplyora ? REPLYORA_FALLBACKS : CLINIC_FALLBACKS;
  return pool[message.length % pool.length] ?? pool[0]!;
}

/** Split a reply into stream-able tokens (words + trailing space). */
export function tokenize(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [text];
}
