import { requirePlatformAdmin } from "@/lib/admin/access";
import { listWorkspaces } from "@/lib/admin/social-data";
import { AccountsTable } from "@/components/admin/accounts-table";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  await requirePlatformAdmin();
  const workspaces = await listWorkspaces();

  const accounts = workspaces.map((w) => ({
    email: w.ownerEmail,
    name: w.ownerName,
    workspaceName: w.name,
    createdAt: w.createdAt,
    newsletterOptIn: w.newsletterOptIn,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Accounts</h1>
        <p className="mt-1 text-sm text-ink/60">
          Every account on Replyora, with their newsletter opt-in. Copy the
          opted-in emails to send the monthly newsletter.
        </p>
      </div>
      <AccountsTable accounts={accounts} />
    </div>
  );
}
