"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

interface Target {
  label: string;
  href: string;
  hint: string;
  icon: typeof Search;
}

const SECTIONS: Target[] = [
  { label: "Clients", href: "/clients", hint: "All clients", icon: Users },
  { label: "To-Do", href: "/tasks", hint: "Tasks", icon: CalendarClock },
  { label: "Assets", href: "/assets", hint: "Library", icon: ImageIcon },
  { label: "Studio", href: "/studio", hint: "Batch create", icon: Sparkles },
  { label: "Invoices", href: "/invoices", hint: "Billing", icon: FileText },
  { label: "Settings", href: "/settings", hint: "Workspace", icon: Settings },
];

/**
 * Global command bar. Press ⌘K / Ctrl+K (or dispatch `replyora:command`) to
 * open, search across clients + workspace sections, and jump straight there.
 * Mounted once in the portal layout so it works on every page.
 */
export function CommandBar({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const clientTargets: Target[] = clients.map((c) => ({
      label: c.name,
      href: `/clients/${c.id}`,
      hint: "Client",
      icon: LayoutGrid,
    }));
    const all = [...clientTargets, ...SECTIONS];
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((t) => t.label.toLowerCase().includes(needle));
  }, [q, clients]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("replyora:command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("replyora:command", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-oxblood/15 bg-cream shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-oxblood/10 px-4 py-3">
              <Search className="h-4 w-4 text-ink/40" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search clients & sections…"
                className="flex-1 bg-transparent text-sm text-ink outline-none"
              />
              <kbd className="rounded bg-oat px-1.5 py-0.5 text-[10px] text-ink/50">
                esc
              </kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-ink/40">
                  No matches.
                </p>
              )}
              {results.map((t) => (
                <button
                  key={t.href}
                  type="button"
                  onClick={() => go(t.href)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-oxblood/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-oxblood/10 text-oxblood">
                    <t.icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink">
                    {t.label}
                  </span>
                  <span className="text-[11px] text-ink/45">{t.hint}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
