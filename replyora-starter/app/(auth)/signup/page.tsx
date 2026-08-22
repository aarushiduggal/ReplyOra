import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { betaGateOn, checkInvite } from "@/lib/beta";
import { readInviteCookie } from "@/lib/beta-cookie";

// The invite is re-checked on every visit, so this can never be cached.
export const dynamic = "force-dynamic";

/**
 * Sign-up, invite-only while the beta is closed.
 *
 * The code can arrive two ways: on the query string (?invite=…) straight from
 * /join, or in the cookie /join dropped. The cookie is what survives the trip
 * to Google and back, so it's the fallback, not the primary.
 *
 * Anyone without a valid invite goes to the waitlist rather than a locked form
 * — a dead end with no next step is how you lose the person entirely.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;

  if (!betaGateOn()) return <AuthForm mode="signup" />;

  const code = invite?.trim() || (await readInviteCookie());
  if (!code) redirect("/waitlist");

  try {
    const check = await checkInvite(code);
    if (!check.ok) redirect(`/join/${encodeURIComponent(code)}`);
  } catch {
    // Can't reach the database — send them somewhere with a next step rather
    // than rendering a form whose submit is guaranteed to fail.
    redirect("/waitlist");
  }

  return <AuthForm mode="signup" invite={code} />;
}
