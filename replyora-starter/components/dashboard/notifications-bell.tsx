"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CalendarCheck, MessageSquare, UserPlus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relativeTime } from "@/lib/format";
import type { NotificationItem, NotificationType } from "@/lib/data/types";

const ICON: Record<NotificationType, typeof Bell> = {
  lead: UserPlus,
  booking: CalendarCheck,
  handoff: MessageSquare,
  followup: Bell,
};

export function NotificationsBell({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [items, setItems] = useState(notifications);
  const unread = items.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink transition-colors hover:bg-oat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-oxblood px-1 text-[10px] font-semibold text-cream">
            {unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.map((n) => ({ ...n, read: true })))
              }
              className="text-xs text-oxblood hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            items.map((n) => {
              const Icon = ICON[n.type];
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  className="flex gap-3 border-b border-border px-3 py-3 transition-colors last:border-0 hover:bg-oat"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-oat text-oxblood">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">
                      {n.title}
                      {!n.read && (
                        <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-oxblood align-middle" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
        <Link
          href="/dashboard/settings"
          className="block border-t border-border px-3 py-2 text-center text-xs text-muted-foreground hover:text-oxblood"
        >
          Notification settings
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
