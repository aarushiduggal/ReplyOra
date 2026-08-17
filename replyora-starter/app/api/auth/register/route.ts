import { NextResponse } from "next/server";

import { createUser, getUserByEmail } from "@/lib/auth/users";
import { USE_AUTHJS } from "@/lib/data/mode";

/**
 * Email + password sign-up (Auth.js Credentials doesn't create accounts).
 * Creates the Neon user; the client then calls signIn("credentials", …).
 */
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// Best-effort in-memory rate limit per IP, mirroring /api/chat. This endpoint is
// public and runs bcrypt (cost 10) on every accepted request, so an unthrottled
// flood is both a CPU cost and a way to probe which emails exist via the 409.
// Serverless instances are short-lived so this isn't a hard guarantee — it stops
// a single caller hammering signup. ~5 attempts / minute.
const RATE_HITS = new Map<string, number[]>();
function rateLimited(key: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (RATE_HITS.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  RATE_HITS.set(key, hits);
  return hits.length > max;
}

export async function POST(req: Request) {
  if (!USE_AUTHJS) {
    return NextResponse.json({ error: "not_enabled" }, { status: 400 });
  }

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

  let body: { email?: unknown; password?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : email.split("@")[0] || null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists — try logging in." },
        { status: 409 },
      );
    }
    await createUser({ email, password, name });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Couldn't create your account. Please try again." },
      { status: 500 },
    );
  }
}
