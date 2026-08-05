import { Reveal } from "@/components/marketing/motion";

/**
 * Content wall — a varied-height gallery of the kind of content we plan and
 * produce, using the sourced content photos (feed-N). Clean tiles: no text over
 * the images. Brand-shoot + founder photos are NOT used here (they live in their
 * own sections), so nothing is reused.
 */

interface Shot {
  file: string;
  span: string;
}

const SHOTS: Shot[] = [
  { file: "feed-2.jpg", span: "row-span-2" },
  { file: "feed-4.jpg", span: "" },
  { file: "feed-6.jpg", span: "" },
  { file: "feed-8.jpg", span: "row-span-2" },
  { file: "feed-10.jpg", span: "" },
  { file: "feed-3.jpg", span: "" },
];

export function WorkGallery() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
            Made with Replyora
          </p>
          <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
            The kind of content that stops the scroll.
          </h2>
          <p className="mt-4 text-ink/70">
            A feel for the posts, reels and stories we plan and produce — warm,
            polished and unmistakably on brand.
          </p>
        </Reveal>

        <div className="mt-14 grid auto-rows-[180px] grid-cols-2 gap-4 sm:auto-rows-[220px] md:grid-cols-3">
          {SHOTS.map((s, i) => (
            <Reveal key={s.file} delay={i * 0.06} className={s.span}>
              <div
                className="h-full w-full overflow-hidden rounded-2xl border border-oxblood/10 bg-oat transition-transform duration-300 hover:-translate-y-1"
                style={{
                  backgroundImage: `url(/marketing/${s.file})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
