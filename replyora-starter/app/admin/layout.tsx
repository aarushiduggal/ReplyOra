import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/admin/access";
import { StaffShell } from "@/components/admin/staff-shell";
import { Wordmark } from "@/components/brand/wordmark";
import { USE_AUTHJS } from "@/lib/data/mode";
import { getCurrentUser } from "@/lib/auth/session";
import { isStaff, isOwner } from "@/lib/auth/owner";
import { countNewWaitlist } from "@/lib/waitlist";

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
    // Never let a badge lookup break the portal.
    const waiting = await countNewWaitlist().catch(() => 0);
    return (
      <StaffShell
        staffName={user.fullName || user.email.split("@")[0] || "Staff"}
        staffRole={isOwner(user.email) ? "superadmin" : "staff"}
        waitlistCount={waiting}
      >
        {children}
      </StaffShell>
    );
  }

  const staff = await requirePlatformAdmin();
  return (
    <StaffShell staffName={staff.name} staffRole={staff.role}>
      {children}
    </StaffShell>
  );
}
