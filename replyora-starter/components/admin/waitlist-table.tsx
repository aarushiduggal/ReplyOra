"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Copy, Loader2, Search, Ticket, X } from "lucide-react";

import {
  createInvitesAction,
  inviteFromWaitlistAction,
  revokeInviteAction,
  setWaitlistStatusAction,
  type InviteResult,
} from "@/app/admin/waitlist/actions";
import { cn } from "@/lib/utils";

export interface WaitlistRow {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: string | null;
  clients: string | null;
  note: string | null;
  source: string;
  status: string;
  inviteCode: string | null;
  createdAt: string;
}

export interface InviteRow {
  code: string;
  label: string | null;
  email: string | null;
  createdAt: string;
  usedAt: string | null;
  usedByEmail: string | null;
  revokedAt: string | null;
}

function dateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
}

/** Copy-to-clipboard that confirms itself, so you know the link is on the clipboard. */
function CopyLink({ url, label = "Copy link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard is blocked in some browsers/contexts — select it instead
          // so the link is never unreachable.
          window.prompt("Copy this invite link:", url);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/25 px-2.5 py-1 text-[11px] font-semibold text-ink/80 transition-colors hover:border-ink/60 hover:text-ink"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function WaitlistTable({
  rows,
  invites,
  betaCount,
}: {
  rows: WaitlistRow[];
  invites: InviteRow[];
  betaCount: number;
}) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"waitlist" | "invites">("waitlist");
  const [pending, start] = useTransition();
  const [fresh, setFresh] = useState<InviteResult[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((r) =>
      [r.email, r.name, r.company, r.role, r.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(n)),
    );
  }, [rows, q]);

  const waiting = rows.filter((r) => r.status === "new").length;
  const openInvites = invites.filter((i) => !i.usedAt && !i.revokedAt).length;

  function invite(row: WaitlistRow) {
    setBusy(row.email);
    start(async () => {
      try {
        const res = await inviteFromWaitlistAction(row.email, row.name);
        setFresh((cur) => [res, ...cur]);
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* ── Counters ──────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Waiting" value={waiting} hint="not yet invited" />
        <Stat label="Beta users" value={betaCount} hint="redeemed an invite" />
        <Stat label="Open links" value={openInvites} hint="sent, not used yet" />
      </div>

      {/* ── Generate unassigned links ─────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/70">
          Invite links for DMs
        </p>
        <p className="mt-1 text-[12px] text-ink/55">
          Generate a link before you know someone&apos;s email — for Instagram
          DMs. Each one works once.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const made = await createInvitesAction(n);
                  setFresh((cur) => [...made, ...cur]);
                })
              }
              className="rounded-full bg-oxblood px-3.5 py-1.5 text-[12px] font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                `Generate ${n}`
              )}
            </button>
          ))}
        </div>

        {fresh.length > 0 && (
          <ul className="mt-4 space-y-2">
            {fresh.map((f) => (
              <li
                key={f.code}
                className="flex flex-wrap items-center gap-3 rounded-lg bg-oat/50 px-3 py-2"
              >
                <code className="font-mono text-[12px] text-ink/90">{f.url}</code>
                <CopyLink url={f.url} />
                {f.emailed ? (
                  <span className="text-[11px] text-emerald-700">Emailed ✓</span>
                ) : f.emailReason ? (
                  <span className="text-[11px] text-amber-700">
                    Not emailed ({f.emailReason}) — send it yourself
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {(
          [
            ["waitlist", `Waitlist (${rows.length})`],
            ["invites", `Invites (${invites.length})`],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setTab(v)}
            aria-pressed={tab === v}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
              tab === v
                ? "bg-oxblood text-cream"
                : "border border-ink/20 text-ink/70 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
        <div className="relative ml-auto max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            aria-label="Search the waitlist"
            className="w-full rounded-full border border-border bg-white py-2 pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink/40 focus:border-oxblood"
          />
        </div>
      </div>

      {tab === "waitlist" ? (
        filtered.length === 0 ? (
          <Empty>
            {rows.length === 0
              ? "Nobody on the waitlist yet. Once your DMs land, they'll show up here."
              : "Nothing matches that search."}
          </Empty>
        ) : (
          <ul className="space-y-2">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-border bg-white p-4"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {r.name || r.email}
                      {r.company && (
                        <span className="ml-2 font-normal text-ink/60">
                          · {r.company}
                        </span>
                      )}
                    </p>
                    <p className="text-[12px] text-ink/60">{r.email}</p>
                    <p className="mt-1 flex flex-wrap gap-2 text-[11px] text-ink/55">
                      {r.role && <Tag>{r.role}</Tag>}
                      {r.clients && <Tag>{r.clients} accounts</Tag>}
                      <Tag>{r.source}</Tag>
                      <span>{dateTime(r.createdAt)}</span>
                    </p>
                    {r.note && (
                      <p className="mt-2 border-l-2 border-ink/20 pl-3 text-[12px] italic leading-relaxed text-ink/70">
                        {r.note}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusPill status={r.status} />
                    {r.status !== "invited" && (
                      <button
                        type="button"
                        disabled={pending && busy === r.email}
                        onClick={() => invite(r)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-3 py-1.5 text-[11px] font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {pending && busy === r.email ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Ticket className="h-3 w-3" />
                        )}
                        Invite
                      </button>
                    )}
                    {r.status !== "declined" && (
                      <button
                        type="button"
                        onClick={() =>
                          start(() =>
                            setWaitlistStatusAction(r.email, "declined").then(
                              () => undefined,
                            ),
                          )
                        }
                        className="text-[11px] text-ink/45 transition-colors hover:text-ink/80"
                      >
                        Not a fit
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : invites.length === 0 ? (
        <Empty>No invites generated yet.</Empty>
      ) : (
        <ul className="space-y-2">
          {invites.map((i) => {
            const url = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${i.code}`;
            const state = i.revokedAt
              ? "revoked"
              : i.usedAt
                ? "used"
                : "open";
            return (
              <li
                key={i.code}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-4 py-3"
              >
                <code className="font-mono text-[12px] text-ink/90">{i.code}</code>
                <span className="text-[12px] text-ink/60">
                  {i.label || i.email || "unassigned"}
                </span>
                <StatusPill status={state} />
                <span className="text-[11px] text-ink/45">
                  {i.usedAt
                    ? `used ${dateTime(i.usedAt)}${i.usedByEmail ? ` · ${i.usedByEmail}` : ""}`
                    : dateTime(i.createdAt)}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  {state === "open" && (
                    <>
                      <CopyLink url={url} />
                      <button
                        type="button"
                        onClick={() =>
                          start(() =>
                            revokeInviteAction(i.code).then(() => undefined),
                          )
                        }
                        aria-label={`Revoke invite ${i.code}`}
                        className="text-ink/40 transition-colors hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl text-ink">{value}</p>
      <p className="text-[11px] text-ink/45">{hint}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-oat/70 px-2 py-0.5 text-ink/70">
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "invited" || status === "used"
      ? "bg-emerald-400/15 text-emerald-700"
      : status === "declined" || status === "revoked"
        ? "bg-ink/10 text-ink/50"
        : "bg-amber-400/15 text-amber-700";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
        tone,
      )}
    >
      {status}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-ink/20 px-4 py-12 text-center text-[13px] text-ink/50">
      {children}
    </p>
  );
}
