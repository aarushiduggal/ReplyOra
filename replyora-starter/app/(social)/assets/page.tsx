import { PageShell } from "@/components/social/page-shell";
import { SectionScaffold } from "@/components/social/section-scaffold";

export default function AssetsPage() {
  return (
    <PageShell>
      <SectionScaffold
        num="03"
        label="Assets"
        headline="One shared library for every client's media."
        blurb="Upload photos, videos and graphics once — drop them into any client's grid."
        blocks={6}
      />
    </PageShell>
  );
}
