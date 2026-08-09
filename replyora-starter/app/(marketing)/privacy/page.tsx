import { getLegalDoc, legalMetadata } from "@/lib/legal";
import { LegalPage } from "@/components/marketing/legal-page";

export const dynamic = "force-static";

export const metadata = {
  ...legalMetadata("privacy"),
  title: { absolute: "Privacy Policy · ReplyOra" },
};

export default async function PrivacyPage() {
  const doc = await getLegalDoc("privacy");
  return <LegalPage doc={doc} />;
}
