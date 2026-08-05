"use client";

/**
 * An infinite, auto-scrolling strip of content pillars and platform words.
 * Pure CSS animation (duplicated track), pauses on hover, respects
 * prefers-reduced-motion. No images, no network.
 */

const WORDS = [
  "Reels",
  "Carousels",
  "TikToks",
  "Captions",
  "Grid planning",
  "Story ideas",
  "Hooks that land",
  "Content calendar",
  "Hashtags",
  "Approvals",
  "Brand kit",
  "Reports",
];

export function PlatformMarquee() {
  return (
    <section
      aria-label="What Replyora creates"
      className="relative overflow-hidden border-y border-oxblood/10 bg-oat/40 py-5"
    >
      {/* soft edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-oat/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-oat/80 to-transparent" />

      <div className="rly-marquee flex w-max items-center gap-0 whitespace-nowrap">
        {[0, 1].map((track) => (
          <ul
            key={track}
            aria-hidden={track === 1}
            className="flex items-center gap-0"
          >
            {WORDS.map((w) => (
              <li key={`${track}-${w}`} className="flex items-center">
                <span className="px-6 font-display text-lg italic text-wine sm:text-xl">
                  {w}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-rose/60" aria-hidden="true" />
              </li>
            ))}
          </ul>
        ))}
      </div>

      <style>{`
        .rly-marquee {
          animation: rly-marquee-scroll 34s linear infinite;
        }
        .rly-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes rly-marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rly-marquee { animation: none; }
        }
      `}</style>
    </section>
  );
}
