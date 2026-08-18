import Link from "next/link";
import { ArrowRight, Instagram, Music2, Plus } from "lucide-react";

import { getWorkspace } from "@/lib/data/workspace";

/**
 * Post-login brand picker — the first thing you see after signing in (like
 * Entire Socials' client list). Pick a brand to manage, or add a new one.
 *
 * Light, editorial, engaging. Multi-brand comes from the workspace layer once
 * Auth.js lands; for now it lists the signed-in workspace + a "new brand" tile.
 */
export default async function BrandsPage() {
  let name = "Your brand";
  try {
    name = (await getWorkspace()).name;
  } catch {
    // pre-auth / mock — fall back to a friendly default
  }

  const brands = [{ id: "primary", name, handle: "@replyora" }];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <span className="font-wordmark text-xl text-oxblood">
            replyora
            <span className="ml-0.5 inline-block h-1.5 w-1.5 animate-ping rounded-full bg-rose align-super" />
          </span>
          <Link href="/dashboard/settings" className="text-xs uppercase tracking-widest text-ink/50 hover:text-oxblood">
            Settings
          </Link>
        </div>

        {/* heading */}
        <div className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-roseink">
            ( Select a brand )
          </p>
          <h1 className="mt-3 font-display text-5xl text-oxblood">Your brands</h1>
          <p className="mt-2 text-sm text-ink/60">
            Pick a brand to manage its content, or add a new one.
          </p>
        </div>

        {/* brand grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <Link
              key={b.id}
              href="/dashboard"
              className="group flex flex-col justify-between rounded-2xl border border-oxblood/15 bg-white p-6 transition-all hover:-translate-y-1 hover:border-oxblood/40 hover:shadow-lg"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-oxblood font-wordmark text-lg text-cream">
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="mt-4 font-display text-2xl text-wine">{b.name}</h2>
                <p className="text-xs text-ink/50">{b.handle}</p>
                <div className="mt-3 flex items-center gap-3 text-ink/40">
                  <Instagram className="h-4 w-4" />
                  <Music2 className="h-4 w-4" />
                </div>
              </div>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-oxblood">
                Enter
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}

          {/* new brand */}
          <Link
            href="/onboarding"
            className="flex min-h-[196px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-oxblood/25 bg-oat/20 p-6 text-center transition-colors hover:border-oxblood/50 hover:bg-oat/40"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-oxblood/30 text-oxblood">
              <Plus className="h-5 w-5" />
            </span>
            <span className="font-display text-lg text-oxblood">New brand</span>
            <span className="text-xs text-ink/50">Add another business to manage</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
