import { requirePlatformAdmin } from "@/lib/admin/access";
import { listAdminAudit } from "@/lib/admin/social-data";
import { getStaffList } from "@/lib/admin/data";
import { StaffManager } from "@/components/admin/staff-manager";
import { AuditViewer } from "@/components/admin/audit-viewer";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const staff = await requirePlatformAdmin();
  const [members, audit] = await Promise.all([
    Promise.resolve(getStaffList()),
    listAdminAudit(200),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Staff &amp; audit</h1>
        <p className="mt-1 text-sm text-ink/60">
          Manage who has staff access, and review every action taken in the
          portal.
        </p>
      </div>

      <StaffManager
        staff={members}
        canManage={staff.role === "superadmin"}
      />

      <div>
        <h2 className="mb-3 font-semibold text-ink">Audit log</h2>
        <AuditViewer
          entries={audit.map((e) => ({
            id: e.id,
            actorName: e.actorName,
            workspaceName: e.workspaceName,
            action: e.action,
            target: e.target,
            createdAt: e.createdAt,
          }))}
        />
      </div>
    </div>
  );
}
