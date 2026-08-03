"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

/** Floating bottom-left "+ TO-DO" pill — quick jump to the task board. */
export function TodoPill() {
  return (
    <Link
      href="/tasks"
      className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full bg-oxblood px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream shadow-[0_8px_24px_rgba(92,26,26,0.25)] transition-transform hover:-translate-y-0.5"
    >
      <Plus className="h-3.5 w-3.5" />
      To-Do
    </Link>
  );
}
