import { getLegalDoc, legalMetadata } from "@/lib/legal";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = legalMetadata("security");

export default async function SecurityPage() {
  const doc = await getLegalDoc("security");
  return <LegalPage doc={doc} />;
}
