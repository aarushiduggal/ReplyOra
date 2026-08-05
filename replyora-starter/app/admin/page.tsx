import { getAdminOverview } from "@/lib/admin/overview";
import { CommandCenter } from "@/components/admin/command-center";

export const dynamic = "force-dynamic";

/**
 * Staff command center — the god-view over every agency, brand, revenue and
 * anything that needs attention. Mock = seeded sample agencies; Neon = real.
 */
export default async function AdminHome() {
  const data = await getAdminOverview();
  return <CommandCenter data={data} />;
}
