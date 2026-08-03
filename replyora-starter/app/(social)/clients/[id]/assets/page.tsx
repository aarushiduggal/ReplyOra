import { SectionScaffold } from "@/components/social/section-scaffold";

export default function ClientAssetsPage() {
  return (
    <SectionScaffold
      num="05"
      label="Assets"
      headline="This client's media, ready to place."
      blurb="Per-client library of photos, videos and graphics that flow into the grid and calendar."
      blocks={6}
    />
  );
}
