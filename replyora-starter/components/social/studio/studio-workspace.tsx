"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Crop, ImagePlus, Sparkles, X } from "lucide-react";

import type { Asset } from "@/lib/social/assets";
import type { GeneratedPost } from "@/lib/social/generate";
import {
  PILLARS,
  PLATFORMS,
  PLATFORM_LABEL,
  POST_FORMAT_LABEL,
  type Platform,
  type PostFormat,
} from "@/lib/social/types";

const FORMATS: PostFormat[] = ["post", "reel", "carousel", "story"];
const STEPS = ["Brief", "Generate", "Review & attach", "Save to grid"];
import {
  generateDraftsAction,
  saveDraftsAction,
} from "@/app/(social)/clients/[id]/studio/actions";
import { GuideTrigger } from "@/components/social/guide";
import { ImageEditor } from "@/components/social/studio/image-editor";
import { MonthBatch } from "@/components/social/studio/month-batch";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Draft extends GeneratedPost {
  id: string;
  pillar: string;
  platform: Platform;
  format: PostFormat;
  mediaUrl: string | null;
  selected: boolean;
}

export function StudioWorkspace({
  clientId,
  clientName,
  businessName,
  assets,
}: {
  clientId: string;
  clientName: string;
  businessName: string;
  assets: Asset[];
}) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [pillar, setPillar] = useState<string>(PILLARS[0]);
  const [format, setFormat] = useState<PostFormat>("post");
  const [count, setCount] = useState(3);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pickingFor, setPickingFor] = useState<string | null>(null); // draft id awaiting an image
  const [editingFor, setEditingFor] = useState<string | null>(null); // draft id whose photo is being cropped
  const [genPending, startGen] = useTransition();
  const [savePending, startSave] = useTransition();
  // "single" is the original one-topic flow; "month" batches and schedules a
  // whole month. Kept side by side so neither path loses anything.
  const [mode, setMode] = useState<"single" | "month">("single");

  function generate() {
    if (!topic.trim()) return;
    startGen(async () => {
      // A failure here used to leave the transition unresolved, so the button
      // stayed disabled forever with nothing explaining why. Always settle, and
      // always say something.
      try {
        const posts = await generateDraftsAction({
          businessName: businessName || clientName,
          industry: "",
          platform,
          pillar,
          topic,
          count,
        });
        if (posts.length === 0) {
          toast({ title: "No captions came back — try again.", type: "error" });
          return;
        }
        // Pre-fill each new draft's image from the library in order (if any).
        setDrafts(
          posts.map((p, i) => ({
            ...p,
            id: `d${i}-${Date.now()}-${p.caption.length}`,
            pillar,
            platform,
            format,
            mediaUrl: assets[i]?.url ?? null,
            selected: true,
          })),
        );
      } catch {
        toast({
          title: "Couldn't generate those captions.",
          body: "Please try again in a moment.",
          type: "error",
        });
      }
    });
  }

  function patchDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function save() {
    const chosen = drafts.filter((d) => d.selected);
    if (chosen.length === 0) return;
    startSave(async () => {
      try {
        await saveDraftsAction(
          clientId,
          chosen.map((d) => ({
            caption: d.caption,
            hashtags: d.hashtags,
            pillar: d.pillar,
            platform: d.platform,
            format: d.format,
            mediaUrl: d.mediaUrl,
          })),
        );
        setDrafts([]);
        setTopic("");
        router.refresh();
        toast({
          title: `${chosen.length} draft${chosen.length === 1 ? "" : "s"} saved to the grid`,
          type: "success",
        });
      } catch {
        // Keep the drafts on screen so nothing the user wrote is lost.
        toast({
          title: "Couldn't save those drafts.",
          body: "Your work is still here — please try again.",
          type: "error",
        });
      }
    });
  }

  const selectedCount = drafts.filter((d) => d.selected).length;
  // Which numbered step is current: Brief(0) → Generate(1) → Review(2) → Save(3).
  const stepIndex =
    drafts.length === 0 ? (genPending ? 1 : 0) : selectedCount > 0 ? 3 : 2;

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 04 )</span> Studio
          <GuideTrigger pageKey="studio" clientId={clientId} />
        </div>
      </div>
      <p className="mb-4 text-[12px] font-medium text-ink/85">
        {mode === "single" ? (
          <>
            Create a batch of posts for {clientName} — follow the steps: write a brief, generate
            captions, attach photos, then save. They land on the Grid &amp; Calendar as drafts.
          </>
        ) : (
          <>
            Plan and write a whole month for {clientName} in one pass — choose the
            shape and the voice, review every caption, then schedule the lot.
          </>
        )}
      </p>

      {/* Mode switch — one post at a time, or the whole month. */}
      <div className="mb-6 inline-flex rounded-full border border-ink/15 p-1">
        {(
          [
            ["single", "One post"],
            ["month", "Whole month"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={cn(
              "rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
              mode === value
                ? "bg-ink text-porcelain"
                : "text-ink/70 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "month" ? (
        <MonthBatch clientId={clientId} businessName={businessName || clientName} />
      ) : (
        <SinglePost />
      )}
    </div>
  );

  /**
   * The original one-topic flow, unchanged — extracted only so the mode switch
   * can choose between it and the month batcher.
   */
  function SinglePost() {
    return (
      <>
      {/* Numbered step guide — highlights where you are */}
      <ol className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {STEPS.map((label, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  active
                    ? "bg-oxblood text-cream"
                    : done
                      ? "bg-oxblood/15 text-oxblood"
                      : "border border-ink/25 text-ink/45"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${active ? "text-oxblood" : "text-ink/55"}`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="mx-1 hidden h-px w-5 bg-ink/20 sm:block" />}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Brief */}
        <aside className="space-y-4 self-start rounded-2xl border border-ink/10 bg-ink/[0.01] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-oxblood">The brief</p>
          <L label="What's this batch about?">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="e.g. Spring colour promo — book now, 20% off toner top-ups"
              className={inp}
            />
          </L>
          <div className="grid grid-cols-2 gap-3">
            <L label="Platform">
              <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className={inp}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
              </select>
            </L>
            <L label="Pillar">
              <select value={pillar} onChange={(e) => setPillar(e.target.value)} className={inp}>
                {PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </L>
          </div>
          <L label="Format">
            <select value={format} onChange={(e) => setFormat(e.target.value as PostFormat)} className={inp}>
              {FORMATS.map((f) => <option key={f} value={f}>{POST_FORMAT_LABEL[f]}</option>)}
            </select>
          </L>
          <L label="How many posts">
            <div className="flex flex-wrap gap-1.5">
              {[1, 3, 6, 9, 12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`h-9 w-9 rounded-full border text-[12px] font-semibold transition-colors ${
                    count === n
                      ? "border-oxblood bg-oxblood text-cream"
                      : "border-ink/20 text-ink/70 hover:border-oxblood"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </L>
          <button
            type="button"
            onClick={generate}
            disabled={genPending || !topic.trim()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-oxblood px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" /> {genPending ? "Generating…" : `Generate ${count} posts`}
          </button>
          <p className="text-[10px] text-ink/60">
            {assets.length > 0
              ? `${assets.length} photo${assets.length === 1 ? "" : "s"} in the library will be attached automatically — swap any per post.`
              : "Tip: upload photos on the Assets tab and they'll attach here automatically."}
          </p>
        </aside>

        {/* Drafts */}
        <div>
          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-6 py-16 text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/80">
                Write a brief and generate — your posts appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
                  {selectedCount} of {drafts.length} selected
                </p>
                <button
                  type="button"
                  onClick={save}
                  disabled={savePending || selectedCount === 0}
                  className="rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {savePending ? "Saving…" : `Save ${selectedCount} to grid`}
                </button>
              </div>

              {drafts.map((d) => (
                <div
                  key={d.id}
                  className={`rounded-xl border p-3 ${d.selected ? "border-oxblood/40 bg-oxblood/[0.03]" : "border-ink/10"}`}
                >
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={d.selected}
                      onChange={() => patchDraft(d.id, { selected: !d.selected })}
                      className="mt-1 accent-oxblood"
                    />

                    {/* Image slot */}
                    <div className="shrink-0">
                      {d.mediaUrl ? (
                        <div className="group relative h-16 w-16 overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={d.mediaUrl} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => patchDraft(d.id, { mediaUrl: null })}
                            className="absolute right-0.5 top-0.5 rounded-full bg-ink/70 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Remove photo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFor(editingFor === d.id ? null : d.id);
                              setPickingFor(null);
                            }}
                            className="absolute left-0.5 top-0.5 rounded-full bg-ink/70 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Crop this photo"
                          >
                            <Crop className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPickingFor(pickingFor === d.id ? null : d.id)}
                            className="absolute inset-x-0 bottom-0 bg-ink/60 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white"
                          >
                            Swap
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPickingFor(pickingFor === d.id ? null : d.id)}
                          className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-oxblood/30 text-oxblood/70 hover:border-oxblood hover:text-oxblood"
                        >
                          <ImagePlus className="h-4 w-4" />
                          <span className="text-[8px] font-semibold uppercase">Photo</span>
                        </button>
                      )}
                    </div>

                    {/* Caption (editable) */}
                    <div className="min-w-0 flex-1">
                      <textarea
                        value={d.caption}
                        onChange={(e) => patchDraft(d.id, { caption: e.target.value })}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-transparent bg-transparent text-sm text-ink hover:border-ink/15 focus:border-oxblood focus:bg-white focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-oxblood">{d.hashtags.join(" ")}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/70">
                        {PLATFORM_LABEL[d.platform]} · {d.pillar}
                      </p>
                    </div>
                  </div>

                  {/* Crop & compose the attached photo for this draft */}
                  {editingFor === d.id && d.mediaUrl && (
                    <div className="mt-3">
                      <ImageEditor
                        src={d.mediaUrl}
                        clientId={clientId}
                        onDone={(url) => {
                          patchDraft(d.id, { mediaUrl: url });
                          setEditingFor(null);
                        }}
                        onCancel={() => setEditingFor(null)}
                      />
                    </div>
                  )}

                  {/* Inline asset picker for this draft */}
                  {pickingFor === d.id && (
                    <div className="mt-3 border-t border-ink/10 pt-3">
                      {assets.length === 0 ? (
                        <p className="text-[11px] text-ink/70">
                          No photos yet — upload some on the Assets tab.
                        </p>
                      ) : (
                        <div className="grid grid-cols-8 gap-1.5">
                          {assets.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                patchDraft(d.id, { mediaUrl: a.url });
                                setPickingFor(null);
                              }}
                              className={`relative aspect-square overflow-hidden rounded-md border-2 ${d.mediaUrl === a.url ? "border-oxblood" : "border-transparent hover:border-oxblood/40"}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={a.url} alt="" className="h-full w-full object-cover" />
                              {d.mediaUrl === a.url && (
                                <span className="absolute right-0.5 top-0.5 rounded-full bg-oxblood p-0.5 text-cream">
                                  <Check className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </>
    );
  }
}

const inp =
  "w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood";

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/90">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
