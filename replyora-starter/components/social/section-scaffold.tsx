import { SectionHeader } from "./section-header";

/**
 * Shared placeholder body for the portal's section pages — keeps every page
 * on the same editorial rhythm (numbered header, one light Playfair line, a
 * hairline, and airy placeholder blocks) until each is wired to real data.
 */
export function SectionScaffold({
  num,
  label,
  headline,
  blurb,
  blocks = 3,
}: {
  num: string;
  label: string;
  headline: string;
  blurb?: string;
  blocks?: number;
}) {
  return (
    <div>
      <SectionHeader num={num} label={label} />
      <h2 className="mt-6 max-w-xl font-display text-3xl leading-tight text-oxblood sm:text-4xl">
        {headline}
      </h2>
      {blurb && <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-ink/90">{blurb}</p>}

      <div className="mt-10 h-px w-full bg-ink/10" />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: blocks }).map((_, i) => (
          <div
            key={i}
            className="flex h-44 items-end rounded-xl border border-ink/[0.08] bg-ink/[0.015] p-4"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/60">
              Coming together
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
