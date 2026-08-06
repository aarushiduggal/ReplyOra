"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Sparkles, X } from "lucide-react";

import type { Asset } from "@/lib/social/assets";
import type { GeneratedPost } from "@/lib/social/generate";
import { PILLARS, PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/social/types";
import {
  generateDraftsAction,
  saveDraftsAction,
} from "@/app/(social)/clients/[id]/studio/actions";
import { GuideTrigger } from "@/components/social/guide";
import { toast } from "@/lib/toast";

interface Draft extends GeneratedPost {
  id: string;
  pillar: string;
  platform: Platform;
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
  const [count, setCount] = useState(3);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pickingFor, setPickingFor] = useState<string | null>(null); // draft id awaiting an image
  const [genPending, startGen] = useTransition();
  const [savePending, startSave] = useTransition();

  function generate() {
    if (!topic.trim()) return;
    startGen(async () => {
      const posts = await generateDraftsAction({
        businessName: businessName || clientName,
        industry: "",
        platform,
        pillar,
        topic,
        count,
      });
      // Pre-fill each new draft's image from the library in order (if any).
      setDrafts(
        posts.map((p, i) => ({
          ...p,
          id: `d${i}-${Date.now()}-${p.caption.length}`,
          pillar,
          platform,
          mediaUrl: assets[i]?.url ?? null,
          selected: true,
        })),
      );
    });
  }

  function patchDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function save() {
    const chosen = drafts.filter((d) => d.selected);
    if (chosen.length === 0) return;
    startSave(async () => {
      await saveDraftsAction(
        clientId,
        chosen.map((d) => ({
          caption: d.caption,
          hashtags: d.hashtags,
          pillar: d.pillar,
          platform: d.platform,
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
    });
  }

  const selectedCount = drafts.filter((d) => d.selected).length;

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 04 )</span> Studio
          <GuideTrigger pageKey="studio" clientId={clientId} />
        </div>
      </div>
      <p className="mb-6 text-[12px] font-medium text-ink/85">
        Create a batch of posts for {clientName} — write a brief, generate captions, attach photos,
        and save. They land on the Grid &amp; Calendar as drafts, ready to schedule.
      </p>

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
    </div>
  );
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
