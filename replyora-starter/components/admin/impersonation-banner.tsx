"use client";

import { useTransition } from "react";
import { Eye, Pencil, X } from "lucide-react";

import { stopImpersonation } from "@/lib/admin/actions";

/**
 * Shown across the CLIENT dashboard while a staff member is impersonating, so
 * it's always obvious you're acting on behalf of a client (and in which mode).
 */
export function ImpersonationBanner({
  clientName,
  mode,
}: {
  clientName: string;
  mode: "edit" | "view";
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-center gap-3 bg-oxblood px-4 py-2 text-center text-sm text-cream">
      {mode === "view" ? (
        <Eye className="h-4 w-4 shrink-0" />
      ) : (
        <Pencil className="h-4 w-4 shrink-0" />
      )}
      <span>
        <strong>Staff</strong> — acting as <strong>{clientName}</strong> (
        {mode === "view" ? "read-only" : "edit mode"}).
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => stopImpersonation())}
        className="inline-flex items-center gap-1 rounded-full border border-cream/30 px-2.5 py-0.5 text-xs hover:bg-cream/10 disabled:opacity-50"
      >
        <X className="h-3 w-3" /> Exit
      </button>
    </div>
  );
}
