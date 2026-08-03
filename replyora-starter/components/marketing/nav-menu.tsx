"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { NavGroup } from "@/components/marketing/nav-config";

/**
 * Desktop hover mega-menu with hover-intent delay and full keyboard support
 * (disclosure pattern: aria-expanded button controlling a panel of links).
 */
export function NavMenu({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  function clearTimers() {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }

  function openWithIntent() {
    clearTimers();
    enterTimer.current = setTimeout(() => setOpen(true), 90);
  }

  function closeWithDelay() {
    clearTimers();
    leaveTimer.current = setTimeout(() => setOpen(false), 140);
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openWithIntent}
      onMouseLeave={closeWithDelay}
      onBlur={(e) => {
        // Close when keyboard focus leaves the whole group.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => {
          clearTimers();
          setOpen(true);
        }}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open ? "text-oxblood" : "text-ink/70 hover:text-oxblood",
        )}
      >
        {group.label}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        role="menu"
        aria-label={group.label}
        className={cn(
          "absolute left-0 top-full z-50 w-80 pt-3 transition-all duration-150",
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0",
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-rose/20 bg-oat p-2 shadow-xl">
          {group.items.map((item) => (
            <Link
              key={item.label + item.href}
              href={item.href}
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="group/item flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-cream focus-visible:bg-cream focus-visible:outline-none"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-oxblood/10 text-oxblood transition-colors group-hover/item:bg-oxblood group-hover/item:text-cream">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-oxblood">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-ink/70 group-hover/item:text-ink/90">
                  {item.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
