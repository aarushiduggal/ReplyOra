"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { USE_SUPABASE } from "@/lib/data/mode";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import type { NotificationItem } from "@/lib/data/types";

export function Topbar({
  workspaceName,
  planName,
  userName,
  userEmail,
  notifications,
  isStaff = false,
}: {
  workspaceName: string;
  planName: string;
  userName: string;
  userEmail: string;
  notifications: NotificationItem[];
  isStaff?: boolean;
}) {
  const router = useRouter();

  async function handleSignOut() {
    if (USE_SUPABASE) {
      await createClient().auth.signOut();
    }
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <span className="truncate font-display text-lg text-ink">
          {workspaceName}
        </span>
        <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
          {planName} plan
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <NotificationsBell notifications={notifications} />

        <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 text-sm outline-none transition-colors hover:bg-oat focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-oxblood text-xs text-cream">
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden font-medium text-ink sm:inline">
            {userName}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium text-ink">{userName}</p>
            <p className="text-xs font-normal text-muted-foreground">
              {userEmail}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <UserRound className="h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/">
              <ExternalLink className="h-4 w-4" />
              View marketing site
            </Link>
          </DropdownMenuItem>
          {isStaff && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <ShieldCheck className="h-4 w-4" />
                  Staff portal
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
