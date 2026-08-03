"use client";

import { Printer } from "lucide-react";

/** Print / Save-as-PDF trigger (uses the browser's print-to-PDF). */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 print:hidden"
    >
      <Printer className="h-3.5 w-3.5" /> Save as PDF
    </button>
  );
}
