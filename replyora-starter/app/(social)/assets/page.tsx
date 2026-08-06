import { AssetsWorkspace } from "@/components/social/assets/assets-workspace";
import { PageShell } from "@/components/social/page-shell";
import { listWorkspaceAssets } from "@/lib/social/assets";
import { hasStorage } from "@/lib/social/storage";

export const dynamic = "force-dynamic";

/**
 * Workspace-wide media library — every client's assets in one place. Uploads
 * here land in the shared library (no client id) and can be dropped into any
 * client's grid.
 */
export default async function AssetsPage() {
  const assets = await listWorkspaceAssets().catch(() => []);
  return (
    <PageShell>
      <AssetsWorkspace
        clientId=""
        clientName="the shared library"
        assets={assets}
        storageReady={hasStorage()}
      />
    </PageShell>
  );
}
