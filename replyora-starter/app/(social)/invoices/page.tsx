import { PageShell } from "@/components/social/page-shell";
import { SectionScaffold } from "@/components/social/section-scaffold";

export default function InvoicesPage() {
  return (
    <PageShell>
      <SectionScaffold
        num="04"
        label="Invoices"
        headline="Bill your clients — branded, in one place."
        blurb="Draft, send and track invoices with branded PDF exports and a revenue view."
      />
    </PageShell>
  );
}
