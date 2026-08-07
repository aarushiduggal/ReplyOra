import { Lock } from "lucide-react";

import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Upsell shown when a client section isn't included in the current plan.
 * Rendered server-side by a gated page instead of the real feature. Adding a
 * gated feature is handled by us — the client emails to have it turned on.
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
  const subject = encodeURIComponent(`Add ${addonLabel} to my Replyora plan`);
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
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=${subject}`}
        className="mt-6 inline-flex items-center rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90"
      >
        Email us to add it
      </a>
      <p className="mt-2 text-[11px] text-ink/50">{CONTACT_EMAIL}</p>
    </div>
  );
}
