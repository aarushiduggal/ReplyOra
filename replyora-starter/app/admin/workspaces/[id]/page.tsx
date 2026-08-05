import { notFound } from "next/navigation";

import { getAgencyDetail } from "@/lib/admin/overview";
import { AgencyDetail } from "@/components/admin/agency-detail";

export const dynamic = "force-dynamic";

export default async function AdminAgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agency = await getAgencyDetail(id);
  if (!agency) notFound();
  return <AgencyDetail agency={agency} />;
}
