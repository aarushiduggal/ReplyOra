import { PageShell } from "@/components/social/page-shell";
import { SectionScaffold } from "@/components/social/section-scaffold";

export default function SettingsPage() {
  return (
    <PageShell>
      <SectionScaffold
        num="05"
        label="Settings"
        headline="Your workspace, your brand, your billing."
        blurb="Profile · Preferences · Integrations · Billing · Data."
      />
    </PageShell>
  );
}
