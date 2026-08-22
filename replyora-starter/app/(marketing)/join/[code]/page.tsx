import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { betaGateOn, checkInvite } from "@/lib/beta";
import { setInviteCookie } from "@/lib/beta-cookie";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Your beta invite",
  robots: { index: false, follow: false },
};

// Invites are checked against the database on every visit, so this page must
// never be cached or statically rendered.
export const dynamic = "force-dynamic";

/**
 * Beta invite landing — the link you send in a DM.
 *
 * On a good code we drop it in a cookie and hand the visitor to /signup. The
 * cookie matters because the Google button leaves our site: without it the code
 * would be lost the moment they authenticate, and they'd bounce off the gate
 * holding a valid invite.
 *
 * The code is NOT spent here. Someone opening the link twice, or reading it on
 * their phone and signing up on a laptop, must still get in — it's only
 * consumed once an account actually exists.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  if (!betaGateOn()) redirect("/signup");

  let result: Awaited<ReturnType<typeof checkInvite>>;
  try {
    result = await checkInvite(code);
  } catch {
    return (
      <Invalid
        title="We couldn't check that invite"
        body="Something went wrong on our end — not on yours. Please try the link again in a moment."
      />
    );
  }

  if (result.ok) {
    await setInviteCookie(code);
    redirect(`/signup?invite=${encodeURIComponent(code)}`);
  }

  if (result.reason === "used") {
    return (
      <Invalid
        title="This invite has already been used"
        body="If that was you, just log in. If not, let us know and we'll send you a fresh one."
        showLogin
      />
    );
  }

  return (
    <Invalid
      title="This invite link isn't valid"
      body="It may have been mistyped or replaced. Join the waitlist and we'll get you a working link."
    />
  );
}

function Invalid({
  title,
  body,
  showLogin = false,
}: {
  title: string;
  body: string;
  showLogin?: boolean;
}) {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-lg px-6 py-24 text-center sm:py-32">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-roseink">
          Closed beta
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-wine sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink/75">{body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link href={showLogin ? "/login" : "/waitlist"}>
              {showLogin ? "Log in" : "Join the waitlist →"}
            </Link>
          </Button>
          <Button asChild variant="link" className="text-ink">
            <Link href="/">Back to the site</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
