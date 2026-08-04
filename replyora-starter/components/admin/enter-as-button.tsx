"use client";

import { useTransition } from "react";
import { LogIn } from "lucide-react";

import { enterAsAction } from "@/app/admin/actions";

/** Staff "Enter as" button — starts impersonating the given workspace. */
export function EnterAsButton({ workspaceId }: { workspaceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => enterAsAction(workspaceId))}
      className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      <LogIn className="h-3.5 w-3.5" /> Enter as
    </button>
  );
}
