import { getLegalDoc, legalMetadata } from "@/lib/legal";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = legalMetadata("privacy");

export default async function PrivacyPage() {
  const doc = await getLegalDoc("privacy");
  return <LegalPage doc={doc} />;
}
