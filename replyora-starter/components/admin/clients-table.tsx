"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Search } from "lucide-react";

export interface ClientRow {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  status: string;
  paused: boolean;
  mrr: number;
  messagesUsed: number;
  messagesCap: number;
  overLimit: boolean;
  signupAt: string;
  lastActiveAt: string;
  setupStatus: string;
}

type SortKey = "name" | "plan" | "status" | "mrr" | "messagesUsed" | "signupAt" | "lastActiveAt";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  trialing: "bg-sky-100 text-sky-700",
  past_due: "bg-rose-100 text-rose-700",
  canceled: "bg-oat text-ink/50",
};

function date(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export function ClientsTable({ rows }: { rows: ClientRow[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("mrr");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        !needle ||
        r.name.toLowerCase().includes(needle) ||
        r.ownerName.toLowerCase().includes(needle) ||
        r.ownerEmail.toLowerCase().includes(needle),
    );
    const sorted = [...list].sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return dir === "asc" ? sorted : sorted.reverse();
  }, [rows, q, sort, dir]);

  function toggleSort(k: SortKey) {
    if (sort === k) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSort(k);
      setDir("desc");
    }
  }

  const Th = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <th className={className}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 text-ink/60 hover:text-oxblood"
      >
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients, owners, emails…"
          className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink/40 focus:border-oxblood focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border bg-white text-xs uppercase tracking-wide">
            <tr className="[&>th]:px-4 [&>th]:py-3">
              <Th k="name" label="Client" />
              <th className="px-4 py-3 text-ink/60">Owner</th>
              <Th k="plan" label="Plan" />
              <Th k="status" label="Status" />
              <Th k="mrr" label="MRR" />
              <Th k="messagesUsed" label="Usage" />
              <Th k="signupAt" label="Signup" />
              <Th k="lastActiveAt" label="Last active" />
              <th className="px-4 py-3 text-ink/60">Setup</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-oat">
                <td className="px-4 py-3">
                  <Link href={`/admin/clients/${r.id}`} className="font-medium text-ink hover:underline">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/60">
                  <div>{r.ownerName}</div>
                  {r.ownerEmail && <div className="text-xs text-ink/40">{r.ownerEmail}</div>}
                </td>
                <td className="px-4 py-3 capitalize text-ink/70">{r.plan}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[r.status] ?? "bg-oat text-ink/60"}`}>
                    {r.paused ? "paused" : r.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/70">${r.mrr}</td>
                <td className="px-4 py-3">
                  <span className={r.overLimit ? "text-rose-600" : "text-ink/70"}>
                    {r.messagesUsed.toLocaleString()} / {r.messagesCap.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/60">{date(r.signupAt)}</td>
                <td className="px-4 py-3 text-ink/60">{date(r.lastActiveAt)}</td>
                <td className="px-4 py-3">
                  <span className="rounded px-1.5 py-0.5 text-xs capitalize text-ink/70">
                    {r.setupStatus.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-ink/50">
                  No clients match “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
