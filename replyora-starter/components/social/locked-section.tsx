import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Upsell shown when a client section isn't included in the current plan.
 * Rendered server-side by a gated page instead of the real feature.
 */
export function LockedSection({
  title,
  description,
  addonLabel,
  priceLabel,
}: {
  title: string;
  description: string;
  addonLabel: string;
  priceLabel: string;
}) {
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-oxblood/25 bg-white/60 px-8 py-14 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-oxblood/10 text-oxblood">
        <Lock className="h-5 w-5" />
      </span>
      <h2 className="mt-4 font-display text-2xl text-oxblood">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink/70">{description}</p>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
        {addonLabel} · {priceLabel}
      </p>
      <Link
        href="/settings?tab=plan"
        className="mt-6 inline-flex items-center rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90"
      >
        Add this to your plan
      </Link>
    </div>
  );
}
