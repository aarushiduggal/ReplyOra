"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle, CalendarClock, CircleDollarSign, Layers, Play, Plus,
  Sparkles, Users, Wallet, ArrowRight, PauseCircle, RefreshCw,
} from "lucide-react";

import type { AgencyOverview, AgencyClientRow, RiskFlag } from "@/lib/social/agency";
import type { TeamMember, AgencyRole, ClientRole } from "@/lib/social/team";
import { ROLE_LABEL } from "@/lib/social/team";
import type { Retainer } from "@/lib/social/retainers";
import { monthlyValueCents } from "@/lib/social/retainers";
import {
  assignAction, unassignAction, setRoleAction, createRetainerAction,
  runRetainerAction, runDueRetainersAction, setRetainerStatusAction,
} from "@/lib/social/agency-actions";

type Tab = "needs" | "risk" | "team" | "retainers";

const money = (c: number, cur = "AUD") =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(c / 100);

export function CommandCenter({
  overview, members, retainers,
}: {
  overview: AgencyOverview;
  members: TeamMember[];
  retainers: Retainer[];
}) {
  const [tab, setTab] = useState<Tab>("needs");
  const { kpis, clients, capacity } = overview;

  const needs = clients.filter((c) => c.runwayDays < 5);
  const risk = clients.filter((c) => c.health === "at_risk" || c.risks.length > 0);

  const tabs: { key: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { key: "needs", label: "Needs content", icon: CalendarClock, count: needs.length },
    { key: "risk", label: "At risk", icon: AlertTriangle, count: kpis.atRisk },
    { key: "team", label: "Team & capacity", icon: Users, count: capacity.length },
    { key: "retainers", label: "Retainers", icon: Wallet, count: retainers.filter((r) => r.status === "active").length },
  ];

  return (
    <div>
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Kpi icon={Layers} label="Clients" value={String(kpis.clients)} />
        <Kpi icon={CalendarClock} label="Need content" value={String(kpis.needsContent)} tone={kpis.needsContent ? "warn" : "ok"} />
        <Kpi icon={AlertTriangle} label="At risk" value={String(kpis.atRisk)} tone={kpis.atRisk ? "risk" : "ok"} />
        <Kpi icon={Sparkles} label="Scheduled · 7d" value={String(kpis.scheduledNext7)} />
        <Kpi icon={CircleDollarSign} label="MRR" value={money(kpis.mrrCents)} tone="ok" />
        <Kpi icon={Wallet} label="Outstanding" value={money(kpis.outstandingCents)} tone={kpis.pastDueCents ? "risk" : "muted"} sub={kpis.pastDueCents ? `${money(kpis.pastDueCents)} past due` : undefined} />
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1.5 border-b border-oxblood/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-oxblood text-cream" : "text-ink/60 hover:bg-oat/60 hover:text-oxblood"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
            {typeof t.count === "number" && (
              <span className={`ml-0.5 rounded-full px-1.5 text-[11px] ${tab === t.key ? "bg-cream/20" : "bg-oxblood/10"}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "needs" && <NeedsContent rows={needs.length ? needs : clients} />}
        {tab === "risk" && <AtRisk rows={risk} members={members} clients={clients} />}
        {tab === "team" && <TeamCapacity capacity={capacity} members={members} clients={clients} />}
        {tab === "retainers" && <Retainers retainers={retainers} clients={clients} mrr={kpis.mrrCents} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────  KPI  ──────────────────────────────── */

function Kpi({ icon: Icon, label, value, sub, tone = "muted" }: {
  icon: typeof Users; label: string; value: string; sub?: string;
  tone?: "ok" | "warn" | "risk" | "muted";
}) {
  const ring = tone === "risk" ? "border-red-300" : tone === "warn" ? "border-amber-300" : tone === "ok" ? "border-emerald-200" : "border-oxblood/10";
  const num = tone === "risk" ? "text-red-700" : tone === "warn" ? "text-amber-700" : "text-oxblood";
  return (
    <div className={`rounded-2xl border ${ring} bg-white p-4`}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/45">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className={`mt-1 font-display text-2xl ${num}`}>{value}</p>
      {sub && <p className="text-[11px] font-medium text-red-600">{sub}</p>}
    </div>
  );
}

/* ────────────────────────  Needs content  ─────────────────────────── */

function NeedsContent({ rows }: { rows: AgencyClientRow[] }) {
  if (rows.length === 0) return <Empty>Every client has a healthy queue. Nice.</Empty>;
  return (
    <div className="space-y-2.5">
      {rows.map((c) => (
        <div key={c.clientId} className="flex flex-col gap-3 rounded-2xl border border-oxblood/10 bg-white p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <HealthDot health={c.health} />
              <p className="font-medium text-ink">{c.clientName}</p>
              <span className="text-xs text-ink/50">· {c.assignees.map((a) => a.name.split(" ")[0]).join(", ") || "unassigned"}</span>
            </div>
            <div className="mt-2 max-w-md">
              <RunwayBar days={c.runwayDays} />
              <p className="mt-1 text-[12px] text-ink/60">
                <span className={c.runwayDays < 3 ? "font-semibold text-red-600" : "font-semibold text-amber-700"}>
                  {c.runwayDays === 0 ? "Queue empty" : `${c.runwayDays} day${c.runwayDays === 1 ? "" : "s"} of content left`}
                </span>
                {" · "}{c.scheduledCount} scheduled · {c.draftCount} drafts
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href={`/clients/${c.clientId}/studio`} className="inline-flex items-center gap-1 rounded-full bg-oxblood px-3 py-1.5 text-xs font-medium text-cream hover:bg-wine">
              <Sparkles className="h-3.5 w-3.5" /> Draft a month
            </Link>
            <Link href={`/clients/${c.clientId}/grid`} className="inline-flex items-center gap-1 rounded-full border border-oxblood/20 px-3 py-1.5 text-xs font-medium text-oxblood hover:bg-oat/50">
              Grid <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────  At risk  ───────────────────────────── */

function AtRisk({ rows, members, clients }: { rows: AgencyClientRow[]; members: TeamMember[]; clients: AgencyClientRow[] }) {
  if (rows.length === 0) return <Empty>No clients at risk right now. 🤎</Empty>;
  return (
    <div className="space-y-2.5">
      {rows.map((c) => (
        <div key={c.clientId} className="rounded-2xl border border-oxblood/10 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HealthDot health={c.health} />
              <p className="font-medium text-ink">{c.clientName}</p>
              <span className="rounded-full bg-oat/60 px-2 py-0.5 text-[11px] font-semibold text-wine">health {c.healthScore}</span>
            </div>
            <Link href={`/clients/${c.clientId}`} className="text-xs font-medium text-oxblood hover:underline">Open workspace →</Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.risks.map((r, i) => <RiskBadge key={i} risk={r} />)}
          </div>
          {c.assignees.length === 0 && (
            <div className="mt-3">
              <AssignInline clientId={c.clientId} members={members} />
            </div>
          )}
        </div>
      ))}
      <p className="pt-1 text-center text-[11px] text-ink/40">{clients.length} clients monitored · worst first</p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: RiskFlag }) {
  const c = risk.severity === "high" ? "bg-red-50 text-red-700 border-red-200"
    : risk.severity === "medium" ? "bg-amber-50 text-amber-800 border-amber-200"
    : "bg-oat/50 text-wine border-oxblood/10";
  return (
    <span title={risk.detail} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${c}`}>
      <AlertTriangle className="h-3 w-3" /> {risk.label}
    </span>
  );
}

/* ──────────────────────────  Team & capacity  ─────────────────────── */

function TeamCapacity({ capacity, members, clients }: {
  capacity: AgencyOverview["capacity"]; members: TeamMember[]; clients: AgencyClientRow[];
}) {
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">Workload this week</p>
        {capacity.map((row) => (
          <div key={row.member.id} className="rounded-2xl border border-oxblood/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-oxblood text-xs font-semibold text-cream">
                  {row.member.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{row.member.name}</p>
                  <p className="text-[11px] text-ink/50">{row.clientCount} clients · {row.member.status}</p>
                </div>
              </div>
              <select
                defaultValue={row.member.role}
                onChange={(e) => start(() => setRoleAction(row.member.id, e.target.value as AgencyRole))}
                disabled={pending}
                className="rounded-lg border border-oxblood/15 bg-white px-2 py-1 text-xs text-ink"
              >
                {(["owner", "manager", "editor", "viewer"] as AgencyRole[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <LoadBar pct={row.loadPct} />
              <p className="mt-1 text-[11px] text-ink/60">
                {row.postsThisWeek}/{row.member.weeklyCapacity} posts · <span className={row.loadPct > 100 ? "font-semibold text-red-600" : row.loadPct > 80 ? "font-semibold text-amber-700" : "text-emerald-700"}>{row.loadPct}% load</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">Assign a client</p>
        <AssignPanel members={members} clients={clients} />
      </div>
    </div>
  );
}

function AssignPanel({ members, clients }: { members: TeamMember[]; clients: AgencyClientRow[] }) {
  const [pending, start] = useTransition();
  const [clientId, setClientId] = useState(clients[0]?.clientId ?? "");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [role, setRole] = useState<ClientRole>("lead");
  return (
    <div className="mt-2 space-y-3 rounded-2xl border border-oxblood/10 bg-white p-4">
      <Field label="Client">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-lg border border-oxblood/15 bg-white px-3 py-2 text-sm">
          {clients.map((c) => <option key={c.clientId} value={c.clientId}>{c.clientName}</option>)}
        </select>
      </Field>
      <Field label="Team member">
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full rounded-lg border border-oxblood/15 bg-white px-3 py-2 text-sm">
          {members.map((m) => <option key={m.id} value={m.id}>{m.name} · {ROLE_LABEL[m.role]}</option>)}
        </select>
      </Field>
      <Field label="Role on client">
        <select value={role} onChange={(e) => setRole(e.target.value as ClientRole)} className="w-full rounded-lg border border-oxblood/15 bg-white px-3 py-2 text-sm">
          {(["lead", "editor", "viewer"] as ClientRole[]).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <button
        onClick={() => start(() => assignAction(clientId, memberId, role))}
        disabled={pending || !clientId || !memberId}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-cream hover:bg-wine disabled:opacity-50"
      >
        <Plus className="h-4 w-4" /> {pending ? "Assigning…" : "Assign"}
      </button>
    </div>
  );
}

function AssignInline({ clientId, members }: { clientId: string; members: TeamMember[] }) {
  const [pending, start] = useTransition();
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  return (
    <div className="flex items-center gap-2">
      <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="rounded-lg border border-oxblood/15 bg-white px-2 py-1 text-xs">
        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <button onClick={() => start(() => assignAction(clientId, memberId, "lead"))} disabled={pending}
        className="rounded-full bg-oxblood px-3 py-1 text-xs font-medium text-cream hover:bg-wine">
        {pending ? "…" : "Assign owner"}
      </button>
    </div>
  );
}

/* ────────────────────────────  Retainers  ─────────────────────────── */

function Retainers({ retainers, clients, mrr }: { retainers: Retainer[]; clients: AgencyClientRow[]; mrr: number }) {
  const [pending, start] = useTransition();
  const nameOf = useMemo(() => new Map(clients.map((c) => [c.clientId, c.clientName])), [clients]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/70">
          <span className="font-display text-lg text-oxblood">{money(mrr)}</span> recurring / month
          <span className="text-ink/40"> · {retainers.filter((r) => r.status === "active").length} active</span>
        </p>
        <button onClick={() => start(() => runDueRetainersAction().then(() => {}))} disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-oxblood/20 px-3 py-1.5 text-xs font-medium text-oxblood hover:bg-oat/50">
          <RefreshCw className="h-3.5 w-3.5" /> {pending ? "Running…" : "Run due billing"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-oxblood/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-oat/40 text-[11px] uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Client</th>
              <th className="px-4 py-2.5 font-semibold">Retainer</th>
              <th className="px-4 py-2.5 font-semibold">Amount</th>
              <th className="px-4 py-2.5 font-semibold">/mo</th>
              <th className="px-4 py-2.5 font-semibold">Next invoice</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-oxblood/5">
            {retainers.map((r) => (
              <tr key={r.id} className="bg-white">
                <td className="px-4 py-3 font-medium text-ink">{nameOf.get(r.clientId) ?? r.clientId}</td>
                <td className="px-4 py-3 text-ink/70">{r.name}{r.autoCharge && <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">auto</span>}</td>
                <td className="px-4 py-3 text-ink/80">{money(r.amountCents, r.currency)}<span className="text-ink/40"> /{r.interval}</span></td>
                <td className="px-4 py-3 text-ink/80">{money(monthlyValueCents(r), r.currency)}</td>
                <td className="px-4 py-3 text-ink/60">{r.nextInvoiceAt ? new Date(r.nextInvoiceAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.status === "active" ? "bg-emerald-50 text-emerald-700" : r.status === "paused" ? "bg-amber-50 text-amber-700" : "bg-ink/5 text-ink/50"}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button title="Invoice now" onClick={() => start(() => runRetainerAction(r.id, nameOf.get(r.clientId)).then(() => {}))} disabled={pending}
                      className="rounded-full border border-oxblood/15 p-1.5 text-oxblood hover:bg-oat/50"><Play className="h-3.5 w-3.5" /></button>
                    <button title={r.status === "active" ? "Pause" : "Resume"} onClick={() => start(() => setRetainerStatusAction(r.id, r.status === "active" ? "paused" : "active"))} disabled={pending}
                      className="rounded-full border border-oxblood/15 p-1.5 text-oxblood hover:bg-oat/50"><PauseCircle className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewRetainer clients={clients} />
    </div>
  );
}

function NewRetainer({ clients }: { clients: AgencyClientRow[] }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  if (!open) return (
    <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-cream hover:bg-wine">
      <Plus className="h-4 w-4" /> New retainer
    </button>
  );
  return (
    <form
      action={(fd) => start(() => createRetainerAction(fd).then(() => setOpen(false)))}
      className="grid gap-3 rounded-2xl border border-oxblood/10 bg-white p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="clientName" value={clients[0]?.clientName ?? ""} />
      <Field label="Client">
        <select name="clientId" className="w-full rounded-lg border border-oxblood/15 bg-white px-3 py-2 text-sm">
          {clients.map((c) => <option key={c.clientId} value={c.clientId}>{c.clientName}</option>)}
        </select>
      </Field>
      <Field label="Retainer name">
        <input name="name" defaultValue="Monthly social retainer" className="w-full rounded-lg border border-oxblood/15 px-3 py-2 text-sm" />
      </Field>
      <Field label="Amount (AUD)">
        <input name="amount" type="number" min="1" step="1" defaultValue="2000" className="w-full rounded-lg border border-oxblood/15 px-3 py-2 text-sm" />
      </Field>
      <Field label="Interval">
        <select name="interval" defaultValue="month" className="w-full rounded-lg border border-oxblood/15 bg-white px-3 py-2 text-sm">
          <option value="week">Weekly</option><option value="month">Monthly</option><option value="quarter">Quarterly</option>
        </select>
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2">
        <button disabled={pending} className="rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-cream hover:bg-wine disabled:opacity-50">
          {pending ? "Creating…" : "Create retainer"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/50 hover:text-ink">Cancel</button>
        <span className="ml-auto text-[11px] text-ink/40">Becomes a Stripe subscription when keys are set.</span>
      </div>
    </form>
  );
}

/* ─────────────────────────────  bits  ─────────────────────────────── */

function HealthDot({ health }: { health: AgencyClientRow["health"] }) {
  const c = health === "healthy" ? "bg-emerald-500" : health === "watch" ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${c}`} />;
}

function RunwayBar({ days }: { days: number }) {
  const pct = Math.max(4, Math.min(100, (days / 21) * 100));
  const c = days < 3 ? "bg-red-500" : days < 5 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-oat">
      <div className={`h-full rounded-full ${c}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function LoadBar({ pct }: { pct: number }) {
  const w = Math.min(100, pct);
  const c = pct > 100 ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-oxblood";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-oat">
      <div className={`h-full rounded-full ${c}`} style={{ width: `${w}%` }} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink/45">{label}</span>
      {children}
    </label>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-oxblood/15 bg-white/60 py-10 text-center text-sm text-ink/50">{children}</div>;
}
