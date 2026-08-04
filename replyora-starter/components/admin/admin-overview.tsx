"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";

import { enterAsAction } from "@/app/admin/actions";
import { SectionHeader } from "@/components/social/section-header";
import type { WorkspaceRow } from "@/lib/admin/social-data";

type Sort = "created" | "name" | "clients";

export function AdminOverview({ workspaces }: { workspaces: WorkspaceRow[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("created");
  const [, startTransition] = useTransition();

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = workspaces.filter(
      (w) =>
        !needle ||
        w.name.toLowerCase().includes(needle) ||
        w.ownerEmail.toLowerCase().includes(needle) ||
        (w.ownerName ?? "").toLowerCase().includes(needle),
    );
    return [...filtered].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "clients"
          ? b.clientCount - a.clientCount
          : b.createdAt.localeCompare(a.createdAt),
    );
  }, [workspaces, q, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeader num="01" label="Workspaces" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/80">
          {workspaces.length} total
        </span>
      </div>
      <h1 className="mt-6 font-display text-3xl text-oxblood">Every workspace</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or owner email…"
          className="w-72 rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-oxblood"
        >
          <option value="created">Newest</option>
          <option value="name">Name A–Z</option>
          <option value="clients">Most clients</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/15 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/70">
              <th className="py-2 pr-3">Workspace</th>
              <th className="py-2 pr-3">Owner</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3 text-right">Clients</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="border-b border-ink/10">
                <td className="py-2.5 pr-3 font-semibold text-ink">
                  <Link href={`/admin/workspaces/${w.id}`} className="hover:text-oxblood">
                    {w.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-3 text-ink/80">
                  <div>{w.ownerName || "—"}</div>
                  <div className="text-[11px] text-ink/60">{w.ownerEmail}</div>
                </td>
                <td className="py-2.5 pr-3 capitalize text-ink/80">{w.accountType ?? "—"}</td>
                <td className="py-2.5 pr-3 capitalize text-ink/80">{w.planStatus}</td>
                <td className="py-2.5 pr-3 text-right text-ink/80">{w.clientCount}</td>
                <td className="py-2.5 pr-3 text-ink/70">{w.createdAt.slice(0, 10)}</td>
                <td className="py-2.5">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/workspaces/${w.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/70 hover:text-oxblood"
                    >
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => startTransition(() => enterAsAction(w.id))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
                    >
                      <LogIn className="h-3 w-3" /> Enter as
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[12px] text-ink/60">
                  No workspaces match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
