"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";

import type { Asset } from "@/lib/social/assets";
import type { GeneratedPost } from "@/lib/social/generate";
import { PILLARS, PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/social/types";
import {
  generateDraftsAction,
  saveDraftsAction,
} from "@/app/(social)/clients/[id]/studio/actions";
import { GuideTrigger } from "@/components/social/guide";

interface Draft extends GeneratedPost {
  id: string;
  pillar: string;
  platform: Platform;
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
  const [batchName, setBatchName] = useState("");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [pillar, setPillar] = useState<string>(PILLARS[0]);
  const [count, setCount] = useState(3);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pickedAssets, setPickedAssets] = useState<string[]>([]);
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
      setDrafts(
        posts.map((p, i) => ({
          ...p,
          id: `d${i}-${p.caption.length}`,
          pillar,
          platform,
          selected: true,
        })),
      );
    });
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
        })),
      );
      setDrafts([]);
      setTopic("");
      setBatchName("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 04 )</span> Studio
          <GuideTrigger pageKey="studio" clientId={clientId} />
        </div>
      </div>
      <p className="mb-6 text-[12px] font-medium text-ink/85">
        Batch-create a set of posts for {clientName} — pick assets, generate captions,
        save drafts. They land on the Grid and Calendar.
      </p>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Batch setup */}
        <aside className="space-y-4">
          <L label="Batch name">
            <input value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. August launch" className={inp} />
          </L>
          <L label="Topic / brief">
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} placeholder="What's this batch about?" className={inp} />
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
          <L label="How many">
            <input type="number" min={1} max={9} value={count} onChange={(e) => setCount(Math.max(1, Math.min(9, Number(e.target.value))))} className={inp} />
          </L>
          <button
            type="button"
            onClick={generate}
            disabled={genPending}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-oxblood px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" /> {genPending ? "Generating…" : "Generate captions"}
          </button>

          {/* asset picker */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">Library ({assets.length})</p>
            {assets.length === 0 ? (
              <p className="mt-2 text-[11px] text-ink/75">No assets yet — upload some on the Assets tab.</p>
            ) : (
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {assets.slice(0, 12).map((a) => {
                  const picked = pickedAssets.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() =>
                        setPickedAssets((prev) =>
                          picked ? prev.filter((x) => x !== a.id) : [...prev, a.id],
                        )
                      }
                      className={`relative aspect-square overflow-hidden rounded-md border-2 ${picked ? "border-oxblood" : "border-transparent"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt="" className="h-full w-full object-cover" />
                      {picked && <span className="absolute right-0.5 top-0.5 rounded-full bg-oxblood p-0.5 text-cream"><Check className="h-2.5 w-2.5" /></span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Drafts */}
        <div>
          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-6 py-16 text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/80">
                Generate a batch to see draft captions here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
                  {drafts.filter((d) => d.selected).length} of {drafts.length} selected
                </p>
                <button
                  type="button"
                  onClick={save}
                  disabled={savePending}
                  className="rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {savePending ? "Saving…" : "Save as drafts"}
                </button>
              </div>
              {drafts.map((d) => (
                <label key={d.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${d.selected ? "border-oxblood/40 bg-oxblood/[0.03]" : "border-ink/10"}`}>
                  <input
                    type="checkbox"
                    checked={d.selected}
                    onChange={() => setDrafts((prev) => prev.map((x) => (x.id === d.id ? { ...x, selected: !x.selected } : x)))}
                    className="mt-1 accent-oxblood"
                  />
                  <div>
                    <p className="whitespace-pre-line text-sm text-ink">{d.caption}</p>
                    <p className="mt-1 text-[11px] text-oxblood">{d.hashtags.join(" ")}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/70">
                      {PLATFORM_LABEL[d.platform]} · {d.pillar}
                    </p>
                  </div>
                </label>
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
