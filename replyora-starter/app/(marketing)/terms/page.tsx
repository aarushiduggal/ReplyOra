import { getLegalDoc, legalMetadata } from "@/lib/legal";
import { LegalPage } from "@/components/marketing/legal-page";

export const dynamic = "force-static";

export const metadata = {
  ...legalMetadata("terms"),
  title: { absolute: "Terms of Service · ReplyOra" },
};

export default async function TermsPage() {
  const doc = await getLegalDoc("terms");
  return <LegalPage doc={doc} />;
}
