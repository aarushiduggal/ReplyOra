"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Images, Loader2, Sparkles } from "lucide-react";

import {
  carouselOutlineAction,
  reelScriptAction,
  saveCarouselDraftAction,
} from "@/app/(social)/clients/[id]/studio/actions";
import type { CarouselOutline, ReelScript } from "@/lib/social/formats";
import { TONES, type Tone } from "@/lib/social/generate";
import { PILLARS, type Platform } from "@/lib/social/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Studio's format tools.
 *
 * Studio only ever produced captions, which meant the TikTok shelf and the
 * carousel editor had nothing feeding them. A reel needs a structure and a
 * carousel needs slide-by-slide copy — different jobs, not longer paragraphs.
 */
export function FormatTools({
  clientId,
  businessName,
  tool,
}: {
  clientId: string;
  businessName: string;
  tool: "reel" | "carousel";
}) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [pillar, setPillar] = useState<string>(PILLARS[0]!);
  const [tone, setTone] = useState<Tone>("warm");
  const [slides, setSlides] = useState(6);
  const [platform] = useState<Platform>(tool === "reel" ? "tiktok" : "instagram");
  const [pending, start] = useTransition();
  const [savePending, startSave] = useTransition();
  const [reel, setReel] = useState<ReelScript | null>(null);
  const [carousel, setCarousel] = useState<CarouselOutline | null>(null);

  function run() {
    if (!topic.trim()) {
      toast({ title: "What's it about? Add a topic first.", type: "error" });
      return;
    }
    start(async () => {
      try {
        const input = { businessName, platform, pillar, topic, tone, slides };
        const res =
          tool === "reel"
            ? await reelScriptAction(input)
            : await carouselOutlineAction(input);

        if (tool === "reel") setReel(res.data as ReelScript);
        else setCarousel(res.data as CarouselOutline);

        // Same rule as captions: never let templates pass as AI silently.
        if (res.source === "template") {
          toast({
            title: "Written with the built-in template",
            body:
              res.reason === "no key"
                ? "Add GEMINI_API_KEY in Netlify for AI-written scripts."
                : `AI unavailable: ${res.reason ?? "unknown"}`,
            type: "info",
          });
        }
      } catch {
        toast({ title: "Couldn't write that. Please try again.", type: "error" });
      }
    });
  }

  function saveCarousel() {
    if (!carousel) return;
    startSave(async () => {
      try {
        await saveCarouselDraftAction(clientId, {
          platform: "instagram",
          pillar,
          caption: carousel.caption,
          hashtags: carousel.hashtags,
          slideNotes: carousel.slides
            .map((s, i) => `${i + 1}. ${s.headline} — ${s.body}`)
            .join("\n"),
        });
        router.refresh();
        toast({
          title: "Saved to the grid as a carousel draft",
          body: "Open it on the Grid to attach the slide images.",
          type: "success",
        });
      } catch {
        toast({ title: "Couldn't save that draft.", type: "error" });
      }
    });
  }

  return (
    <div className="space-y-7">
      <p className="max-w-xl text-[12px] font-medium leading-relaxed text-ink/85">
        {tool === "reel" ? (
          <>
            A reel or TikTok needs a shape, not a paragraph — a hook that earns
            the first two seconds, then beats you can actually film.
          </>
        ) : (
          <>
            Plan a carousel slide by slide, then save it to the Grid and attach
            the images.
          </>
        )}
      </p>

      {/* ── Brief ──────────────────────────────────────────────────────── */}
      <section className="space-y-5 rounded-2xl border border-ink/10 bg-white p-5">
        <Field label="What's it about?">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              tool === "reel"
                ? "e.g. why we always do a strand test first"
                : "e.g. how to make a blonde last between appointments"
            }
            className="w-full rounded-lg border border-ink/15 bg-cream/40 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-ink/40"
          />
        </Field>

        <Field label="Content pillar">
          <div className="flex flex-wrap gap-2">
            {PILLARS.map((p) => (
              <Chip key={p} active={p === pillar} onClick={() => setPillar(p)}>
                {p}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Tone">
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <Chip key={t.value} active={t.value === tone} onClick={() => setTone(t.value)}>
                {t.label}
              </Chip>
            ))}
          </div>
        </Field>

        {tool === "carousel" && (
          <Field label={`Slides (${slides})`}>
            <div className="flex flex-wrap gap-2">
              {[4, 5, 6, 7, 8, 10].map((n) => (
                <Chip key={n} active={n === slides} onClick={() => setSlides(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </Field>
        )}

        <Button onClick={run} disabled={pending} className="w-full sm:w-auto">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Writing…
            </>
          ) : (
            <>
              {tool === "reel" ? (
                <Clapperboard className="h-4 w-4" />
              ) : (
                <Images className="h-4 w-4" />
              )}
              {tool === "reel" ? "Write the script" : "Plan the carousel"}
            </>
          )}
        </Button>
      </section>

      {/* ── Reel script ────────────────────────────────────────────────── */}
      {tool === "reel" && reel && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <Label>Hook · first two seconds</Label>
            <p className="mt-2 font-display text-xl leading-snug text-ink">
              {reel.hook}
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <Label>The shots</Label>
            <ol className="mt-3 space-y-3">
              {reel.beats.map((b, i) => (
                <li
                  key={i}
                  className="grid gap-1 border-b border-ink/8 pb-3 last:border-0 last:pb-0 sm:grid-cols-[64px_1fr]"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
                    {b.at || `Beat ${i + 1}`}
                  </span>
                  <div>
                    <p className="text-[13px] leading-relaxed text-ink">{b.action}</p>
                    {b.onScreen && (
                      <p className="mt-1 inline-block rounded bg-ink px-2 py-0.5 text-[11px] font-semibold text-cream">
                        {b.onScreen}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <Label>Call to action</Label>
            <p className="mt-2 text-[13px] leading-relaxed text-ink">{reel.cta}</p>
            <div className="mt-4 border-t border-ink/8 pt-4">
              <Label>Caption</Label>
              <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink">
                {reel.caption}
              </p>
              {reel.hashtags.length > 0 && (
                <p className="mt-2 text-[11px] text-ink/55">{reel.hashtags.join(" ")}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const text = [
                  `HOOK: ${reel.hook}`,
                  "",
                  ...reel.beats.map(
                    (b, i) =>
                      `${b.at || `Beat ${i + 1}`} — ${b.action}${b.onScreen ? `\n   on screen: ${b.onScreen}` : ""}`,
                  ),
                  "",
                  `CTA: ${reel.cta}`,
                  "",
                  reel.caption,
                  reel.hashtags.join(" "),
                ].join("\n");
                navigator.clipboard
                  .writeText(text)
                  .then(() => toast({ title: "Script copied", type: "success" }))
                  .catch(() => toast({ title: "Couldn't copy that.", type: "error" }));
              }}
              className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood hover:underline"
            >
              Copy the whole script
            </button>
          </div>
        </section>
      )}

      {/* ── Carousel outline ───────────────────────────────────────────── */}
      {tool === "carousel" && carousel && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl text-oxblood">
              {carousel.slides.length} slides
            </h3>
            <Button onClick={saveCarousel} disabled={savePending}>
              {savePending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Save to the grid
                </>
              )}
            </Button>
          </div>

          <ol className="grid gap-3 sm:grid-cols-2">
            {carousel.slides.map((s, i) => (
              <li key={i} className="rounded-2xl border border-ink/10 bg-white p-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                  Slide {i + 1}
                </span>
                <p className="mt-1.5 font-display text-[17px] leading-snug text-ink">
                  {s.headline}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink/75">{s.body}</p>
              </li>
            ))}
          </ol>

          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <Label>Caption</Label>
            <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink">
              {carousel.caption}
            </p>
            {carousel.hashtags.length > 0 && (
              <p className="mt-2 text-[11px] text-ink/55">{carousel.hashtags.join(" ")}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
      {children}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75">
        {label}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
        active
          ? "border-ink bg-ink text-porcelain"
          : "border-ink/20 bg-transparent text-ink/75 hover:border-ink/50 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
