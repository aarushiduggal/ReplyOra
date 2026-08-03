import type { Metadata } from "next";

import { requirePlatformAdmin } from "@/lib/admin/access";
import { StaffShell } from "@/components/admin/staff-shell";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

/**
 * /admin layout — the SECOND enforcement layer. Non-staff get notFound() (404)
 * here even if middleware were bypassed. All data below runs server-side via the
 * service role, gated per handler.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requirePlatformAdmin();
  return (
    <StaffShell staffName={staff.name} staffRole={staff.role}>
      {children}
    </StaffShell>
  );
}
