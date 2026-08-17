"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Sparkles, Trash2 } from "lucide-react";

import {
  generateMonthAction,
  saveMonthAction,
  type MonthDraft,
} from "@/app/(social)/clients/[id]/studio/actions";
import { CADENCES, type Cadence } from "@/lib/social/batch";
import {
  CAPTION_LENGTHS,
  TONES,
  type CaptionLength,
  type Tone,
} from "@/lib/social/generate";
import {
  PILLARS,
  PLATFORMS,
  PLATFORM_LABEL,
  type Platform,
} from "@/lib/social/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Batch a whole month in one pass: pick a shape, generate every caption, review
 * them as a set, then schedule the lot onto the Calendar and Grid.
 *
 * The month options are computed once on mount — the component must not read
 * the clock during render, or the server and client markup disagree.
 */
export function MonthBatch({
  clientId,
  businessName,
}: {
  clientId: string;
  businessName: string;
}) {
  const router = useRouter();

  // This month and the next two, resolved once.
  const months = useMemo(() => {
    const now = new Date();
    return [0, 1, 2].map((add) => {
      const d = new Date(now.getFullYear(), now.getMonth() + add, 1);
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      };
    });
  }, []);

  const [monthIdx, setMonthIdx] = useState(0);
  const [cadence, setCadence] = useState<Cadence>(3);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [pillars, setPillars] = useState<string[]>([
    PILLARS[0],
    PILLARS[1],
    PILLARS[4],
  ]);
  const [tone, setTone] = useState<Tone>("warm");
  const [length, setLength] = useState<CaptionLength>("medium");
  const [voiceNotes, setVoiceNotes] = useState("");
  const [drafts, setDrafts] = useState<MonthDraft[] | null>(null);
  const [genPending, startGen] = useTransition();
  const [savePending, startSave] = useTransition();

  const chosen = months[monthIdx]!;
  const ready = drafts !== null && drafts.length > 0;

  function togglePillar(p: string) {
    setPillars((cur) =>
      cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    );
  }

  function planMonthNow() {
    if (pillars.length === 0) {
      toast({ title: "Pick at least one content pillar.", type: "error" });
      return;
    }
    startGen(async () => {
      try {
        const result = await generateMonthAction({
          clientId,
          businessName,
          industry: "",
          platform,
          year: chosen.year,
          month: chosen.month,
          cadence,
          pillars,
          tone,
          length,
          voiceNotes: voiceNotes.trim() || undefined,
          nowIso: new Date().toISOString(),
          // Minutes EAST of UTC — the server runs in UTC and cannot infer this.
          tzOffsetMinutes: -new Date().getTimezoneOffset(),
        });
        setDrafts(result);
        if (result.length === 0) {
          toast({ title: "No dates left in that month — try the next one.", type: "info" });
        }
      } catch {
        toast({ title: "Couldn't plan that month. Please try again.", type: "error" });
      }
    });
  }

  function scheduleAll() {
    if (!drafts) return;
    startSave(async () => {
      try {
        const { saved } = await saveMonthAction(clientId, drafts);
        toast(
          saved > 0
            ? {
                title: `Scheduled ${saved} post${saved === 1 ? "" : "s"} to the calendar`,
                body: "They're on the Grid and Calendar, ready for approval.",
                type: "success",
              }
            : {
                title: "Nothing to schedule — every caption was empty.",
                type: "info",
              },
        );
        if (saved > 0) {
          setDrafts(null);
          router.refresh();
        }
      } catch {
        toast({ title: "Couldn't schedule those posts. Please try again.", type: "error" });
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* ── Shape of the month ─────────────────────────────────────────── */}
      <section className="space-y-5 rounded-2xl border border-ink/10 bg-white p-5">
        <Field label="Month">
          <div className="flex flex-wrap gap-2">
            {months.map((m, i) => (
              <Chip key={m.label} active={i === monthIdx} onClick={() => setMonthIdx(i)}>
                {m.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="How often">
          <div className="flex flex-wrap gap-2">
            {CADENCES.map((c) => (
              <Chip
                key={c.value}
                active={c.value === cadence}
                onClick={() => setCadence(c.value)}
                title={c.hint}
              >
                {c.label}
              </Chip>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink/60">
            {CADENCES.find((c) => c.value === cadence)?.hint}
          </p>
        </Field>

        <Field label="Platform">
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <Chip key={p} active={p === platform} onClick={() => setPlatform(p)}>
                {PLATFORM_LABEL[p]}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label={`Content pillars (${pillars.length})`}>
          <div className="flex flex-wrap gap-2">
            {PILLARS.map((p) => (
              <Chip key={p} active={pillars.includes(p)} onClick={() => togglePillar(p)}>
                {p}
              </Chip>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink/60">
            Posts rotate through these in order, so the month never lands as six
            of the same thing in a row.
          </p>
        </Field>
      </section>

      {/* ── Voice ──────────────────────────────────────────────────────── */}
      <section className="space-y-5 rounded-2xl border border-ink/10 bg-white p-5">
        <Field label="Tone">
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <Chip key={t.value} active={t.value === tone} onClick={() => setTone(t.value)} title={t.hint}>
                {t.label}
              </Chip>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink/60">
            {TONES.find((t) => t.value === tone)?.hint}
          </p>
        </Field>

        <Field label="Caption length">
          <div className="flex flex-wrap gap-2">
            {CAPTION_LENGTHS.map((l) => (
              <Chip key={l.value} active={l.value === length} onClick={() => setLength(l.value)}>
                {l.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Brand voice notes (optional)">
          <textarea
            value={voiceNotes}
            onChange={(e) => setVoiceNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Never say 'salon'. Always mention we're family-run. Australian spelling."
            className="w-full rounded-lg border border-ink/15 bg-cream/40 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-ink/40"
          />
        </Field>

        <Button onClick={planMonthNow} disabled={genPending} className="w-full sm:w-auto">
          {genPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Writing the month…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Plan &amp; write {chosen.label}
            </>
          )}
        </Button>
      </section>

      {/* ── Review ─────────────────────────────────────────────────────── */}
      {drafts !== null && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl text-oxblood">
              {drafts.length} post{drafts.length === 1 ? "" : "s"} for {chosen.label}
            </h3>
            {ready && (
              <Button onClick={scheduleAll} disabled={savePending}>
                {savePending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Scheduling…
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4" /> Schedule all {drafts.length}
                  </>
                )}
              </Button>
            )}
          </div>

          {drafts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink/20 px-4 py-10 text-center text-[12px] font-medium text-ink/70">
              No dates left in {chosen.label}. Pick a later month.
            </p>
          ) : (
            <ul className="space-y-3">
              {drafts.map((d) => (
                <li
                  key={d.index}
                  className="rounded-xl border border-ink/10 bg-white p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/70">
                    <span className="text-ink">{d.dayLabel}</span>
                    <span className="text-ink/40">·</span>
                    <span>{d.timeLabel}</span>
                    <span className="text-ink/40">·</span>
                    <span className="rounded-full bg-oat/70 px-2 py-0.5 text-ink/80">
                      {d.pillar}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDrafts((cur) =>
                          (cur ?? []).filter((x) => x.index !== d.index),
                        )
                      }
                      className="ml-auto inline-flex items-center gap-1 text-ink/50 transition-colors hover:text-destructive"
                      aria-label={`Remove the post on ${d.dayLabel}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={d.caption}
                    onChange={(e) =>
                      setDrafts((cur) =>
                        (cur ?? []).map((x) =>
                          x.index === d.index ? { ...x, caption: e.target.value } : x,
                        ),
                      )
                    }
                    rows={4}
                    className="w-full resize-y rounded-lg border border-ink/10 bg-cream/30 px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-ink/40"
                  />
                  {d.hashtags.length > 0 && (
                    <p className="mt-2 text-[11px] text-ink/55">
                      {d.hashtags.join(" ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
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
