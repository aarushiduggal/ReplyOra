import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/admin/access";
import { StaffShell } from "@/components/admin/staff-shell";
import { Wordmark } from "@/components/brand/wordmark";
import { USE_AUTHJS } from "@/lib/data/mode";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/owner";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

/**
 * /admin gate.
 * Social (Auth.js): staff-only via STAFF_EMAILS/OWNER_EMAILS; others → /clients.
 * Legacy (Supabase): the platform_admins-based StaffShell.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (USE_AUTHJS) {
    const user = await getCurrentUser();
    if (!isStaff(user.email)) redirect("/clients");
    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        <header className="border-b border-ink/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Wordmark href="/admin" className="text-lg" />
              <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                Staff
              </span>
            </div>
            <Link
              href="/clients"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/80 hover:text-oxblood"
            >
              ← My workspace
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      </div>
    );
  }

  const staff = await requirePlatformAdmin();
  return (
    <StaffShell staffName={staff.name} staffRole={staff.role}>
      {children}
    </StaffShell>
  );
}
