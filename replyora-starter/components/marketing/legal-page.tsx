import { Markdown } from "@/components/marketing/markdown";
import type { LegalDoc } from "@/lib/legal";

/** Shared shell for the markdown-rendered legal pages. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl text-oxblood">{doc.title}</h1>

      {(doc.lastUpdated || doc.effectiveDate) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {doc.effectiveDate && <span>Effective {doc.effectiveDate}</span>}
          {doc.lastUpdated && <span>Last updated {doc.lastUpdated}</span>}
        </div>
      )}

      <div className="mt-8">
        <Markdown content={doc.body} />
      </div>
    </div>
  );
}
