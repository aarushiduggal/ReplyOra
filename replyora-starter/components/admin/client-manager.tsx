"use client";

import { useState, useTransition } from "react";
import { Eye, Pencil, Save, Trash2, Plus, Loader2 } from "lucide-react";

import {
  adminAddKnowledge,
  adminChangePlan,
  adminRemoveKnowledge,
  adminSaveNotes,
  adminSaveProfile,
  adminSetPaused,
  startImpersonation,
} from "@/lib/admin/actions";
import { toast } from "@/lib/toast";
import type { KnowledgeSource, Plan, PlanStatus } from "@/lib/data/types";

interface ProfileShape {
  industry: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

const PLANS: Plan[] = ["none", "starter", "growth", "pro"];
const STATUSES: PlanStatus[] = ["trialing", "active", "past_due", "canceled"];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="mb-3 font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

const field =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-oxblood focus:outline-none";
const btn =
  "inline-flex items-center gap-1.5 rounded-lg bg-oxblood px-3 py-2 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-50";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-ink transition-colors hover:bg-oat";

export function ClientManager({
  clientId,
  initialPlan,
  initialStatus,
  paused,
  initialNotes,
  initialProfile,
  initialKnowledge,
}: {
  clientId: string;
  initialPlan: Plan;
  initialStatus: PlanStatus;
  paused: boolean;
  initialNotes: string;
  initialProfile: ProfileShape;
  initialKnowledge: KnowledgeSource[];
}) {
  const [pending, start] = useTransition();

  // account
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [status, setStatus] = useState<PlanStatus>(initialStatus);
  const [isPaused, setPaused] = useState(paused);

  // notes
  const [notes, setNotes] = useState(initialNotes);

  // profile
  const [profile, setProfile] = useState<ProfileShape>(initialProfile);

  // knowledge
  const [kb, setKb] = useState<KnowledgeSource[]>(initialKnowledge);
  const [kbTitle, setKbTitle] = useState("");
  const [kbBody, setKbBody] = useState("");

  function run(fn: () => Promise<void>, ok: string) {
    start(async () => {
      try {
        await fn();
        toast({ title: ok, type: "success" });
      } catch {
        toast({ title: "Something went wrong", type: "error" });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Impersonation */}
      <div className="flex flex-wrap gap-3">
        <button
          className={btnGhost}
          disabled={pending}
          onClick={() => start(() => startImpersonation(clientId, "view"))}
        >
          <Eye className="h-4 w-4" /> View as (read-only)
        </button>
        <button
          className={btn}
          disabled={pending}
          onClick={() => start(() => startImpersonation(clientId, "edit"))}
        >
          <Pencil className="h-4 w-4" /> Manage in dashboard
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account */}
        <Card title="Account">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-ink/60">
              Plan
              <select value={plan} onChange={(e) => setPlan(e.target.value as Plan)} className={`${field} mt-1 capitalize`}>
                {PLANS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ink/60">
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value as PlanStatus)} className={`${field} mt-1`}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={btn} disabled={pending} onClick={() => run(() => adminChangePlan(clientId, plan, status), "Plan updated")}>
              <Save className="h-4 w-4" /> Save plan
            </button>
            <button
              className={btnGhost}
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await adminSetPaused(clientId, !isPaused);
                  setPaused(!isPaused);
                }, isPaused ? "Client resumed" : "Client paused")
              }
            >
              {isPaused ? "Resume" : "Pause / suspend"}
            </button>
          </div>
        </Card>

        {/* Internal notes */}
        <Card title="Internal notes (staff only)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className={field}
            placeholder="Private notes about this client…"
          />
          <button className={`${btn} mt-3`} disabled={pending} onClick={() => run(() => adminSaveNotes(clientId, notes), "Notes saved")}>
            <Save className="h-4 w-4" /> Save notes
          </button>
        </Card>
      </div>

      {/* Business profile */}
      <Card title="Business profile (edit on behalf)">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["industry", "phone", "email", "website", "address"] as const).map((k) => (
            <label key={k} className="text-xs capitalize text-ink/60">
              {k}
              <input
                value={profile[k]}
                onChange={(e) => setProfile({ ...profile, [k]: e.target.value })}
                className={`${field} mt-1`}
              />
            </label>
          ))}
        </div>
        <label className="mt-3 block text-xs text-ink/60">
          Description
          <textarea
            value={profile.description}
            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            rows={3}
            className={`${field} mt-1`}
          />
        </label>
        <button className={`${btn} mt-3`} disabled={pending} onClick={() => run(() => adminSaveProfile(clientId, profile), "Profile saved")}>
          <Save className="h-4 w-4" /> Save profile
        </button>
      </Card>

      {/* Knowledge base */}
      <Card title={`Knowledge base (${kb.length})`}>
        <div className="space-y-2">
          {kb.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{s.title}</p>
                <p className="truncate text-xs text-ink/40">{s.preview}</p>
              </div>
              <button
                className="text-ink/40 hover:text-rose-600"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    await adminRemoveKnowledge(clientId, s.id);
                    setKb((prev) => prev.filter((x) => x.id !== s.id));
                  }, "Source removed")
                }
                aria-label="Delete source"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {kb.length === 0 && <p className="text-sm text-ink/40">No knowledge yet.</p>}
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-border bg-white p-3">
          <p className="text-xs font-medium text-ink/70">Add knowledge for this client</p>
          <input value={kbTitle} onChange={(e) => setKbTitle(e.target.value)} placeholder="Title (e.g. Winter price list)" className={field} />
          <textarea value={kbBody} onChange={(e) => setKbBody(e.target.value)} rows={2} placeholder="Content the assistant should know…" className={field} />
          <button
            className={btn}
            disabled={pending || !kbTitle.trim() || !kbBody.trim()}
            onClick={() =>
              run(async () => {
                await adminAddKnowledge(clientId, { type: "text", title: kbTitle.trim(), preview: kbBody.trim() });
                setKb((prev) => [
                  { id: `tmp_${Date.now()}`, workspaceId: clientId, type: "text", title: kbTitle.trim(), preview: kbBody.trim(), status: "ready", error: null, sizeBytes: kbBody.length, createdAt: new Date().toISOString() },
                  ...prev,
                ]);
                setKbTitle("");
                setKbBody("");
              }, "Knowledge added — synced to the client")
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </div>
      </Card>
    </div>
  );
}
