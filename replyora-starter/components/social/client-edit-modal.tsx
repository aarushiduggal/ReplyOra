"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, X } from "lucide-react";

import type {
  ClientDetail,
  ClientFeatures,
  ClientBilling,
  BrandColor,
  Pillar,
  BriefPdf,
} from "@/lib/social/client-detail";
import {
  updateClientDetailAction,
  savePillarsAction,
  createInviteAction,
  addBriefPdfAction,
} from "@/app/(social)/clients/[id]/actions";
import { deleteClientAction } from "@/app/(social)/clients/actions";
import { toast } from "@/lib/toast";

const TABS = [
  "Client Info",
  "Brand Kit",
  "Brand Brief",
  "Pillars",
  "Features",
  "Billing",
  "Access",
] as const;
export type Tab = (typeof TABS)[number];

const PLATFORMS = ["instagram", "tiktok", "facebook", "pinterest", "linkedin"];

const field =
  "mt-1 w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood";
const labelC = "text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/70";

export function ClientEditModal({
  detail,
  onClose,
  initialTab = "Client Info",
}: {
  detail: ClientDetail;
  onClose: () => void;
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [pending, startTransition] = useTransition();

  const [d, setD] = useState<ClientDetail>(detail);
  const patch = <K extends keyof ClientDetail>(k: K, v: ClientDetail[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  function save(fields: Parameters<typeof updateClientDetailAction>[1], label = "Saved") {
    startTransition(async () => {
      await updateClientDetailAction(d.id, fields);
      router.refresh();
      toast({ title: label, type: "success" });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-2xl flex-col bg-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-oxblood/10 px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/60">
              Edit / {tab}
            </p>
            <h2 className="font-display text-2xl text-oxblood">{d.name || "Client"}</h2>
          </div>
          <button onClick={onClose} className="text-ink/60 hover:text-oxblood" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-oxblood/10 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                t === tab
                  ? "text-oxblood underline decoration-oxblood underline-offset-[6px]"
                  : "text-ink/50 hover:text-ink/80"
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === "Client Info" && (
            <div className="space-y-5">
              <div>
                <label className={labelC}>Client name</label>
                <input className={field} value={d.name} onChange={(e) => patch("name", e.target.value)} />
              </div>
              <div>
                <label className={labelC}>Brand voice notes</label>
                <textarea
                  className={field}
                  rows={2}
                  placeholder="e.g. Warm, trusted, like a friend who happens to be an expert."
                  value={d.brandVoice}
                  onChange={(e) => patch("brandVoice", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelC}>Package name</label>
                  <input
                    className={field}
                    placeholder="e.g. Premium Social, Growth Retainer…"
                    value={d.packagePlan}
                    onChange={(e) => patch("packagePlan", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelC}>Client started on</label>
                  <input type="date" className={field} value={d.startedOn ?? ""} onChange={(e) => patch("startedOn", e.target.value || null)} />
                </div>
              </div>
              <div>
                <label className={labelC}>Package deliverables</label>
                <textarea
                  className={field}
                  rows={2}
                  placeholder="e.g. 12 posts, 4 reels, 1 strategy call / month"
                  value={d.packageDeliverables}
                  onChange={(e) => patch("packageDeliverables", e.target.value)}
                />
              </div>
              <div>
                <label className={labelC}>Social platforms managed</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => {
                    const on = d.platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          patch(
                            "platforms",
                            on ? d.platforms.filter((x) => x !== p) : [...d.platforms, p],
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                          on
                            ? "border-oxblood bg-oxblood text-cream"
                            : "border-ink/20 text-ink/70 hover:border-oxblood"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              <SaveBar
                pending={pending}
                onSave={() =>
                  save({
                    name: d.name,
                    brandVoice: d.brandVoice,
                    packagePlan: d.packagePlan,
                    startedOn: d.startedOn,
                    packageDeliverables: d.packageDeliverables,
                    platforms: d.platforms,
                  }, "Client info saved")
                }
                label="Save client info"
              />
              <div className="mt-8 border-t border-ink/10 pt-5">
                <p className={labelC}>Delete client</p>
                <p className="mt-1 text-[12px] text-ink/70">Removes this brand and all its data. Can&rsquo;t be undone.</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Delete "${d.name}" and all its data?`)) return;
                    startTransition(async () => {
                      await deleteClientAction(d.id);
                      router.push("/clients");
                    });
                  }}
                  className="mt-3 rounded-full border border-ink/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80 hover:border-rose hover:text-rose"
                >
                  Delete client
                </button>
              </div>
            </div>
          )}

          {tab === "Brand Kit" && (
            <BrandKitTab d={d} setD={setD} clientId={d.id} pending={pending} onSave={save} />
          )}

          {tab === "Brand Brief" && (
            <BriefTab
              clientId={d.id}
              notes={d.briefNotes}
              onNotes={(v) => patch("briefNotes", v)}
              pdfs={d.briefPdfs}
              onDocAdded={(doc) => patch("briefPdfs", [doc, ...d.briefPdfs])}
              pending={pending}
              onSaveNotes={() => save({ briefNotes: d.briefNotes }, "Brief saved")}
            />
          )}

          {tab === "Pillars" && <PillarsTab clientId={d.id} initial={d.pillars} pending={pending} startTransition={startTransition} />}

          {tab === "Features" && (
            <FeaturesTab
              features={d.features}
              onChange={(f) => patch("features", f)}
              pending={pending}
              onSave={() => save({ features: d.features }, "Features saved")}
            />
          )}

          {tab === "Billing" && (
            <BillingTab
              billing={d.billing}
              onChange={(b) => patch("billing", b)}
              pending={pending}
              onSave={() => save({ billing: d.billing }, "Billing saved")}
            />
          )}

          {tab === "Access" && <AccessTab clientId={d.id} initial={d.invites} pending={pending} startTransition={startTransition} />}
        </div>
      </div>
    </div>
  );
}

function SaveBar({ pending, onSave, label }: { pending: boolean; onSave: () => void; label: string }) {
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {label}
      </button>
    </div>
  );
}

function BrandKitTab({
  d,
  setD,
  clientId,
  pending,
  onSave,
}: {
  d: ClientDetail;
  setD: React.Dispatch<React.SetStateAction<ClientDetail>>;
  clientId: string;
  pending: boolean;
  onSave: (fields: Parameters<typeof updateClientDetailAction>[1], label?: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const colors = d.brandColors.length ? d.brandColors : [];
  const labels = ["Primary", "Secondary 1", "Secondary 2", "Secondary 3", "Secondary 4"];

  async function uploadLogo(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("clientId", clientId);
      form.append("target", "logo");
      const res = await fetch("/api/social/assets/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (res.ok && data.url) {
        setD((p) => ({ ...p, logoUrl: data.url! }));
      } else {
        toast({ title: "Logo upload failed — is storage connected?", type: "error" });
      }
    } finally {
      setUploading(false);
    }
  }

  function setColor(i: number, hex: string) {
    const next: BrandColor[] = [...colors];
    next[i] = { label: labels[i] ?? `Colour ${i + 1}`, hex };
    setD((p) => ({ ...p, brandColors: next.filter((c) => c && c.hex) }));
  }

  return (
    <div className="space-y-6">
      <div>
        <label className={labelC}>Logo</label>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-ink/25 bg-white text-[10px] text-ink/40">
            {d.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.logoUrl} alt="" className="h-full w-full rounded-xl object-contain p-1" />
            ) : (
              "No logo"
            )}
          </div>
          <label className="cursor-pointer rounded-full border border-oxblood/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood hover:bg-oxblood/5">
            {uploading ? "Uploading…" : "Upload logo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0] ?? null)} />
          </label>
        </div>
      </div>

      <div>
        <label className={labelC}>Colour palette</label>
        <div className="mt-2 space-y-2">
          {labels.map((lb, i) => (
            <div key={lb} className="flex items-center gap-3">
              <input
                type="color"
                value={colors[i]?.hex ?? "#5C1A1A"}
                onChange={(e) => setColor(i, e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-ink/20 bg-white"
              />
              <span className="w-24 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/60">{lb}</span>
              <input
                className={field + " flex-1"}
                placeholder="#hex"
                value={colors[i]?.hex ?? ""}
                onChange={(e) => setColor(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelC}>Display font</label>
          <input className={field} placeholder="e.g. Playfair Display" value={d.fontDisplay} onChange={(e) => setD((p) => ({ ...p, fontDisplay: e.target.value }))} />
        </div>
        <div>
          <label className={labelC}>Body font</label>
          <input className={field} placeholder="e.g. Montserrat" value={d.fontBody} onChange={(e) => setD((p) => ({ ...p, fontBody: e.target.value }))} />
        </div>
      </div>

      <SaveBar
        pending={pending}
        onSave={() => onSave({ logoUrl: d.logoUrl, brandColors: d.brandColors, fontDisplay: d.fontDisplay, fontBody: d.fontBody }, "Brand kit saved")}
        label="Save brand kit"
      />
    </div>
  );
}

function PillarsTab({
  clientId,
  initial,
  pending,
  startTransition,
}: {
  clientId: string;
  initial: Pillar[];
  pending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  const router = useRouter();
  const [names, setNames] = useState<string[]>(initial.length ? initial.map((p) => p.name) : [""]);

  function save() {
    startTransition(async () => {
      await savePillarsAction(clientId, names.map((n) => ({ name: n })));
      router.refresh();
      toast({ title: "Pillars saved", type: "success" });
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-ink/70">Content pillars show up in the client&rsquo;s workspace and power caption generation.</p>
      <div className="space-y-2">
        {names.map((n, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={field}
              placeholder={`Pillar ${i + 1} — e.g. Education`}
              value={n}
              onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <button type="button" onClick={() => setNames((p) => p.filter((_, j) => j !== i))} className="text-ink/40 hover:text-rose" aria-label="Remove">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setNames((p) => [...p, ""])} className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-oxblood hover:underline">
        <Plus className="h-3.5 w-3.5" /> Add pillar
      </button>
      <SaveBar pending={pending} onSave={save} label="Save pillars" />
    </div>
  );
}

function BriefTab({
  clientId,
  notes,
  onNotes,
  pdfs,
  onDocAdded,
  pending,
  onSaveNotes,
}: {
  clientId: string;
  notes: string;
  onNotes: (v: string) => void;
  pdfs: BriefPdf[];
  onDocAdded: (doc: BriefPdf) => void;
  pending: boolean;
  onSaveNotes: () => void;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState<"brief" | "contract" | null>(null);

  async function uploadPdf(file: File | null, kind: "brief" | "contract") {
    if (!file) return;
    setUploading(kind);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("clientId", clientId);
      form.append("target", "brief");
      const res = await fetch("/api/social/assets/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (res.ok && data.url) {
        await addBriefPdfAction(clientId, { title: file.name, url: data.url, kind });
        onDocAdded({
          id: `tmp_${data.url.slice(-8)}`,
          title: file.name,
          url: data.url,
          kind,
          createdAt: new Date().toISOString(),
        });
        router.refresh();
        toast({ title: kind === "contract" ? "Contract added" : "PDF added", type: "success" });
      } else {
        toast({ title: "Upload failed — is storage connected?", type: "error" });
      }
    } finally {
      setUploading(null);
    }
  }

  const strategyPdfs = pdfs.filter((p) => p.kind !== "contract");
  const contracts = pdfs.filter((p) => p.kind === "contract");

  return (
    <div className="space-y-6">
      <p className="text-[12px] text-ink/70">
        Strategy notes &amp; PDFs the AI reads when drafting captions, planner concepts and reports.
      </p>
      <div>
        <label className={labelC}>Additional notes</label>
        <textarea
          className={field}
          rows={7}
          placeholder="Audience, offers, dos & don'ts, seasonal campaigns — anything the AI should know."
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
        />
        <SaveBar pending={pending} onSave={onSaveNotes} label="Save notes" />
      </div>

      <div className="border-t border-ink/10 pt-5">
        <label className={labelC}>Brand strategy PDFs</label>
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-oxblood/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood hover:bg-oxblood/5">
          {uploading === "brief" ? "Uploading…" : "Upload PDF"}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => uploadPdf(e.target.files?.[0] ?? null, "brief")} />
        </label>
        <div className="mt-3 space-y-1.5">
          {strategyPdfs.length === 0 ? (
            <p className="text-[12px] italic text-ink/50">No documents yet.</p>
          ) : (
            strategyPdfs.map((p) => <DocRow key={p.id} pdf={p} />)
          )}
        </div>
      </div>

      <div className="border-t border-ink/10 pt-5">
        <label className={labelC}>Contract</label>
        <p className="mt-1 text-[11px] text-ink/60">Your signed agreement with this client — kept on file for reference.</p>
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-oxblood/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood hover:bg-oxblood/5">
          {uploading === "contract" ? "Uploading…" : "Upload contract"}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => uploadPdf(e.target.files?.[0] ?? null, "contract")} />
        </label>
        <div className="mt-3 space-y-1.5">
          {contracts.length === 0 ? (
            <p className="text-[12px] italic text-ink/50">No contract on file yet.</p>
          ) : (
            contracts.map((p) => <DocRow key={p.id} pdf={p} />)
          )}
        </div>
      </div>
    </div>
  );
}

function DocRow({ pdf }: { pdf: BriefPdf }) {
  return (
    <a
      href={pdf.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-ink/10 bg-white px-3 py-2 text-[12px] text-ink/80 hover:border-oxblood/30"
    >
      <span className="truncate">{pdf.title}</span>
      <span className="text-oxblood">Open →</span>
    </a>
  );
}

const FEATURE_ROWS: { key: keyof ClientFeatures; label: string; desc: string }[] = [
  { key: "planner", label: "Planner", desc: "Pre-production concept notes on a month grid." },
  { key: "month", label: "Month", desc: "Visual month calendar — dates, media, scheduling." },
  { key: "spreadsheet", label: "Spreadsheet", desc: "List view of every post — status, captions, bulk edits." },
  { key: "approvals", label: "Approval Queue", desc: "Client review queue before posts go live." },
  { key: "gridSuggestion", label: "Grid Suggestion", desc: "Lets the client arrange & suggest their own grid." },
];

function FeaturesTab({
  features,
  onChange,
  pending,
  onSave,
}: {
  features: ClientFeatures;
  onChange: (f: ClientFeatures) => void;
  pending: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-[12px] text-ink/70">Turn features on or off to tailor each client&rsquo;s experience.</p>
      {FEATURE_ROWS.map((r) => (
        <div key={r.key} className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">{r.label}</p>
            <p className="mt-0.5 text-[12px] text-ink/65">{r.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...features, [r.key]: !features[r.key] })}
            className={`mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${features[r.key] ? "bg-oxblood" : "bg-ink/20"}`}
            aria-label={r.label}
          >
            <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${features[r.key] ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      ))}
      <SaveBar pending={pending} onSave={onSave} label="Save features" />
    </div>
  );
}

function BillingTab({
  billing,
  onChange,
  pending,
  onSave,
}: {
  billing: ClientBilling;
  onChange: (b: ClientBilling) => void;
  pending: boolean;
  onSave: () => void;
}) {
  const set = (k: keyof ClientBilling, v: string) => onChange({ ...billing, [k]: v });
  return (
    <div className="space-y-5">
      <p className={labelC}>Bill to</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelC}>Contact name</label>
          <input className={field} value={billing.billToName} onChange={(e) => set("billToName", e.target.value)} />
        </div>
        <div>
          <label className={labelC}>Billing email</label>
          <input className={field} value={billing.billToEmail} onChange={(e) => set("billToEmail", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelC}>Street address</label>
        <input className={field} value={billing.street} onChange={(e) => set("street", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={labelC}>City</label><input className={field} value={billing.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div><label className={labelC}>State</label><input className={field} value={billing.state} onChange={(e) => set("state", e.target.value)} /></div>
        <div><label className={labelC}>ZIP</label><input className={field} value={billing.zip} onChange={(e) => set("zip", e.target.value)} /></div>
      </div>
      <div><label className={labelC}>Country</label><input className={field} value={billing.country} onChange={(e) => set("country", e.target.value)} /></div>
      <div className="border-t border-ink/10 pt-4">
        <p className={labelC}>Overrides — optional, only if this client differs</p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <div><label className={labelC}>Payment terms</label><input className={field} placeholder="Default" value={billing.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} /></div>
          <div><label className={labelC}>Tax rate %</label><input className={field} placeholder="Default" value={billing.taxRate} onChange={(e) => set("taxRate", e.target.value)} /></div>
          <div><label className={labelC}>Currency</label><input className={field} placeholder="AUD" value={billing.currency} onChange={(e) => set("currency", e.target.value)} /></div>
        </div>
      </div>
      <SaveBar pending={pending} onSave={onSave} label="Save billing" />
    </div>
  );
}

function AccessTab({
  clientId,
  initial,
  pending,
  startTransition,
}: {
  clientId: string;
  initial: ClientDetail["invites"];
  pending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("client");
  const [days, setDays] = useState("14");
  const [link, setLink] = useState<string | null>(null);

  function generate() {
    startTransition(async () => {
      const res = await createInviteAction(clientId, {
        recipient,
        email,
        role,
        expiresDays: Number(days) || undefined,
      });
      router.refresh();
      if (res?.token) {
        const url = `${window.location.origin}/portal/${res.token}`;
        setLink(url);
        try {
          await navigator.clipboard.writeText(url);
          toast({ title: "Invite link copied", type: "success" });
        } catch {
          toast({ title: "Invite created", type: "success" });
        }
      } else {
        toast({ title: "Couldn’t create invite — run migration 0008", type: "error" });
      }
    });
  }

  return (
    <div className="space-y-5">
      <p className={labelC}>Generate portal invite</p>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelC}>Recipient name</label><input className={field} placeholder="e.g. Tania" value={recipient} onChange={(e) => setRecipient(e.target.value)} /></div>
        <div><label className={labelC}>Recipient email</label><input className={field} placeholder="tania@brand.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div>
          <label className={labelC}>Role</label>
          <select className={field} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="client">Client · can approve content</option>
            <option value="viewer">Viewer · read only</option>
          </select>
        </div>
        <div>
          <label className={labelC}>Expires</label>
          <select className={field} value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
      </div>
      <SaveBar pending={pending} onSave={generate} label="Generate invite" />
      {link && (
        <p className="break-all rounded-lg border border-oxblood/15 bg-white p-3 text-[12px] text-ink/80">
          {link}
        </p>
      )}
      <div className="border-t border-ink/10 pt-4">
        <p className={labelC}>Previous invites · {initial.length} total</p>
        {initial.length === 0 ? (
          <p className="mt-2 text-[12px] italic text-ink/50">No invites yet.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {initial.map((iv) => (
              <div key={iv.id} className="flex items-center justify-between text-[12px] text-ink/75">
                <span>{iv.recipient || iv.email || "Invite"} · {iv.role}</span>
                <span className="text-ink/45">{iv.createdAt.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
