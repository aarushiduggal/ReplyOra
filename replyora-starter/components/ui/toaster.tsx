"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  TriangleAlert,
  UserPlus,
  X,
} from "lucide-react";

import { TOAST_EVENT, type ToastPayload, type ToastType } from "@/lib/toast";

interface ActiveToast extends ToastPayload {
  id: number;
}

const ICON: Record<ToastType, typeof Bell> = {
  success: CheckCircle2,
  info: Bell,
  lead: UserPlus,
  booking: CalendarCheck,
  error: TriangleAlert,
};

let seq = 0;

export function Toaster() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      const id = seq++;
      setToasts((prev) => [...prev, { ...detail, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 max-w-[calc(100vw-2.5rem)] flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICON[t.type ?? "info"];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-lg"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-oxblood/10 text-oxblood">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{t.title}</p>
              {t.body && (
                <p className="mt-0.5 text-xs text-muted-foreground">{t.body}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
              className="text-muted-foreground hover:text-ink"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
