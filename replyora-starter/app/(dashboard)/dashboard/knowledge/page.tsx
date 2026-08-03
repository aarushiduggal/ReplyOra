import { listKnowledgeSources } from "@/lib/data/knowledge";
import { PageHeader } from "@/components/dashboard/page-header";
import { KnowledgeManager } from "@/components/dashboard/knowledge-manager";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>;
}) {
  const empty = (await searchParams).empty === "1";
  const sources = empty ? [] : await listKnowledgeSources();

  return (
    <div>
      <PageHeader
        title="Knowledge base"
        description="Everything your assistant can draw on to answer. Add text, FAQs, or upload files."
      />
      <div className="p-6">
        <KnowledgeManager initialSources={sources} />
      </div>
    </div>
  );
}
