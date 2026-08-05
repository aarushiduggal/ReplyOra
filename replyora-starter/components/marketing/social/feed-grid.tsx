import { Copy, Film, Heart, Instagram, MessageCircle } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";

/**
 * Phone-framed Instagram grid mock filled with real brand content: photos, two
 * carousels, and one LIVE autoplaying reel (video). Corner icons mark carousels
 * and reels, just like a real feed. Exported as `FeedPhone` so it can be reused
 * (e.g. the "two products" section) alongside the full `FeedGrid` section.
 */

type Tile =
  | { kind: "post"; src: string; pos?: string }
  | { kind: "carousel"; src: string; pos?: string }
  | { kind: "reel"; src: string };

// One reel kept live (centre); the other eight tiles are real brand content.
// The two multi-image collages are tagged as carousels for authenticity.
const TILES: Tile[] = [
  { kind: "post", src: "grid-3.jpg" },
  { kind: "carousel", src: "grid-1.jpg" },
  { kind: "post", src: "grid-2.jpg", pos: "center top" },
  { kind: "post", src: "grid-4.jpg" },
  { kind: "reel", src: "reel-1.mp4" },
  { kind: "post", src: "grid-5.jpg" },
  { kind: "post", src: "planner.jpg", pos: "center top" },
  { kind: "carousel", src: "grid-7.jpg" },
  { kind: "post", src: "grid-8.jpg" },
];

/** The phone-framed feed mock on its own — reusable. */
export function FeedPhone() {
  return (
    <div className="rounded-[2.5rem] border border-oxblood/15 bg-white p-3 shadow-xl shadow-oxblood/5">
      <div className="overflow-hidden rounded-[2rem] border border-oxblood/10">
        {/* phone top bar */}
        <div className="flex items-center gap-3 border-b border-oxblood/10 bg-white px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-oxblood to-rose text-cream">
            <Instagram className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="font-wordmark text-sm text-oxblood">yourbrand</p>
            <p className="text-[10px] text-ink/50">Curated with Replyora</p>
          </div>
          <div className="ml-auto flex gap-4 text-[10px] text-ink/60">
            <span className="text-center">
              <span className="block font-semibold text-ink">128</span>posts
            </span>
            <span className="text-center">
              <span className="block font-semibold text-ink">9.4k</span>followers
            </span>
          </div>
        </div>

        {/* the grid */}
        <div className="grid grid-cols-3 gap-1 bg-white p-1">
          {TILES.map((t) => (
            <div key={t.src} className="relative aspect-square overflow-hidden bg-oat">
              {t.kind === "reel" ? (
                <video
                  src={`/marketing/${t.src}`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage: `url(/marketing/${t.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: t.pos ?? "center",
                  }}
                />
              )}
              {t.kind !== "post" && (
                <span className="absolute right-1.5 top-1.5 text-white drop-shadow">
                  {t.kind === "reel" ? (
                    <Film className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* engagement footer */}
        <div className="flex items-center gap-4 border-t border-oxblood/10 bg-white px-4 py-3 text-ink/50">
          <Heart className="h-4 w-4" />
          <MessageCircle className="h-4 w-4" />
          <span className="ml-auto text-[10px]">Planned for the month ahead</span>
        </div>
      </div>
    </div>
  );
}

export function FeedGrid() {
  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
            Your feed, built for you
          </p>
          <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
            A grid that looks{" "}
            <span className="italic text-wine">unmistakably you.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/70">
            Photos, carousels and reels — planned in place, so you can see the
            whole grid come together before a single thing goes live. Cohesive
            colours, consistent voice, a feed that actually feels curated.
          </p>
          <ul className="mt-7 space-y-3 text-sm text-ink/75">
            {[
              "See the full grid before you post",
              "Posts, carousels and reels — balanced for you",
              "Drag to reorder — the aesthetic stays intact",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />
                {line}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto w-full max-w-sm">
          <FeedPhone />
        </Reveal>
      </div>
    </section>
  );
}
