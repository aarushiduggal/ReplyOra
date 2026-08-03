import { PageShell } from "@/components/social/page-shell";
import { SectionScaffold } from "@/components/social/section-scaffold";

export default function TasksPage() {
  return (
    <PageShell>
      <SectionScaffold
        num="02"
        label="To-Do"
        headline="Everything on your plate, across every client."
        blurb="Cross-client task tracking for the agency — to-do, in progress, done."
      />
    </PageShell>
  );
}
