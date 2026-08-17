"use client";

/**
 * Dashboard render error boundary. If anything in a (social) page throws while
 * rendering, the user gets a calm recovery screen — never a raw server-error
 * page. "Sign out" clears a stale/broken session so a fresh login can land.
 */
export default function SocialError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl text-ink">Something went wrong</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone">
        We hit a snag loading your workspace. Try again — or sign out and log
        back in, which clears any stale session.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-porcelain transition-all duration-150 active:scale-[0.97]"
        >
          Try again
        </button>
        <a
          href="/api/auth/signout?callbackUrl=/login"
          className="rounded-full border border-stone/30 px-5 py-2.5 text-sm font-medium text-ink transition-all duration-150 active:scale-[0.97] hover:bg-white"
        >
          Sign out
        </a>
      </div>
      {error?.digest && (
        <p className="mt-6 text-[11px] text-stone/70">ref: {error.digest}</p>
      )}
    </div>
  );
}
