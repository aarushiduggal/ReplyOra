import { promises as fs } from "fs";
import path from "path";

export type LegalSlug = "privacy" | "terms" | "security";

export interface LegalDoc {
  slug: LegalSlug;
  /** H1 title from the markdown */
  title: string;
  /** Value after "Last updated:" (kept verbatim, incl. any [placeholder]) */
  lastUpdated: string | null;
  /** Value after "Effective date:" if present */
  effectiveDate: string | null;
  /** Full markdown source (unmodified — we don't rewrite the content) */
  content: string;
  /** Body with the H1 + Effective/Last-updated lines removed (rendered in a
   * styled header instead). Wording is otherwise untouched. */
  body: string;
}

const TITLES: Record<LegalSlug, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  security: "Security & Trust",
};

const DESCRIPTIONS: Record<LegalSlug, string> = {
  privacy:
    "How Replyora collects, uses and protects personal information under the Australian Privacy Act and GDPR.",
  terms: "The terms that govern your access to and use of Replyora.",
  security:
    "How Replyora keeps every workspace isolated and secure — tenant isolation, encryption, subprocessors and responsible disclosure.",
};

function extract(content: string, label: string): string | null {
  // Matches lines like: **Last updated:** [July 2026]
  const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, "i");
  const m = content.match(re);
  return m && m[1] ? m[1].trim() : null;
}

/**
 * Load a legal document from content/legal/<slug>.md.
 * Content is returned unmodified — the pages render it as-is.
 */
export async function getLegalDoc(slug: LegalSlug): Promise<LegalDoc> {
  const filePath = path.join(process.cwd(), "content", "legal", `${slug}.md`);
  const content = await fs.readFile(filePath, "utf8");
  const h1 = content.match(/^#\s+(.+)$/m);

  const body = content
    .replace(/^#\s+.+$/m, "") // first H1
    .replace(/^\*\*Effective date:\*\*.*$/im, "")
    .replace(/^\*\*Last updated:\*\*.*$/im, "")
    .replace(/^\s+/, ""); // leading blank lines

  return {
    slug,
    title: h1 && h1[1] ? h1[1].trim() : TITLES[slug],
    lastUpdated: extract(content, "Last updated"),
    effectiveDate: extract(content, "Effective date"),
    content,
    body,
  };
}

export function legalMetadata(slug: LegalSlug) {
  return { title: TITLES[slug], description: DESCRIPTIONS[slug] };
}
