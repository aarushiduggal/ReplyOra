import { getLegalDoc, legalMetadata } from "@/lib/legal";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = legalMetadata("terms");

export default async function TermsPage() {
  const doc = await getLegalDoc("terms");
  return <LegalPage doc={doc} />;
}
