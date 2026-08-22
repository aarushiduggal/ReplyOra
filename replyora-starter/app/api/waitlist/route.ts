import { NextResponse } from "next/server";

import { addWaitlistSignup, isValidEmail } from "@/lib/waitlist";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Public waitlist capture — the only way in while the beta is closed.
 *
 * Idempotent per email, so a double-tap on mobile is never an error. A brand-new
 * signup also pings the owner, because a waitlist nobody reads is just a table.
 */

// Best-effort per-IP throttle, mirroring /api/auth/register. This is public and
// unauthenticated; without it, one script could fill the list with junk.
const RATE_HITS = new Map<string, number[]>();
function rateLimited(key: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (RATE_HITS.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  RATE_HITS.set(key, hits);
  return hits.length > max;
}

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-nf-client-connection-ip") ||
    "anon";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts — please wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  // Honeypot: a real person never fills a hidden field. Answer 200 so a bot
  // learns nothing from the response.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const entry = {
    email,
    name: str(body.name, 120),
    company: str(body.company, 160),
    role: str(body.role, 80),
    clients: str(body.clients, 40),
    note: str(body.note, 1000),
    source: str(body.source, 40) ?? "beta",
  };

  let isNew = false;
  try {
    isNew = await addWaitlistSignup(entry);
  } catch (err) {
    console.error("[waitlist] could not save signup", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  // Fire-and-forget: the person is already on the list, so a failed alert must
  // never turn their successful signup into an error.
  if (isNew) {
    const to = (process.env.OWNER_EMAILS ?? "").split(",")[0]?.trim();
    if (to) {
      const lines = [
        `${entry.name ?? "Someone"} joined the Replyora waitlist.`,
        "",
        `Email:    ${entry.email}`,
        entry.company ? `Company:  ${entry.company}` : null,
        entry.role ? `Role:     ${entry.role}` : null,
        entry.clients ? `Clients:  ${entry.clients}` : null,
        entry.note ? `\nThey said:\n${entry.note}` : null,
        "",
        "Send them an invite from the staff portal → Waitlist.",
      ].filter(Boolean) as string[];
      void sendEmail({
        to,
        subject: `Waitlist: ${entry.name ?? entry.email}${entry.company ? ` (${entry.company})` : ""}`,
        text: lines.join("\n"),
      }).catch(() => {
        /* already logged inside sendEmail */
      });
    }
  }

  return NextResponse.json({ ok: true });
}
