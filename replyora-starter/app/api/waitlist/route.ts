import { NextResponse } from "next/server";

import { addWaitlistSignup, isValidEmail } from "@/lib/waitlist";

export const runtime = "nodejs";

/**
 * Public "Notify me" capture for roadmap features (e.g. voice/phone answering).
 * Validates the email and records interest via the service role (live) or the
 * mock store (local). Idempotent per (email, feature).
 */
export async function POST(req: Request) {
  let body: { email?: unknown; feature?: unknown; source?: unknown };
  try {
    body = await req.json();
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

  const feature =
    typeof body.feature === "string" ? body.feature.slice(0, 40) : "voice";
  const source =
    typeof body.source === "string" ? body.source.slice(0, 40) : "roadmap";

  try {
    await addWaitlistSignup({ email, feature, source });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
