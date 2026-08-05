import { getAdminOverview } from "@/lib/admin/overview";
import { RevenueBoard } from "@/components/admin/revenue-board";

export const dynamic = "force-dynamic";

/** Staff revenue view — MRR/ARR, breakdown, plan mix, at-risk, per-agency. */
export default async function AdminRevenuePage() {
  const data = await getAdminOverview();
  return <RevenueBoard data={data} />;
}
