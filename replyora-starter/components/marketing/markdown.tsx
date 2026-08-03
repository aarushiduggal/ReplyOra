import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * On-brand markdown renderer for the legal pages.
 * Playfair oxblood headings, Montserrat body, styled tables and blockquote
 * callouts (used for the "Pre-launch status" and "not legal advice" notes).
 */
const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-10 font-display text-3xl text-oxblood">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 font-display text-2xl text-oxblood">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 font-semibold text-ink">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 leading-relaxed text-ink/80">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-oxblood underline underline-offset-2 hover:text-wine"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-ink/80">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-ink/80">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-6 rounded-xl border border-rose/30 border-l-4 border-l-rose bg-oat/60 px-5 py-3 text-sm text-ink/80 [&_p]:mt-2 [&_p:first-child]:mt-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children }) => (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-oat/60">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-border px-4 py-2.5 text-left font-medium text-ink">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-4 py-2.5 align-top text-ink/80">
      {children}
    </td>
  ),
  tr: ({ children }) => <tr className="last:[&>td]:border-0">{children}</tr>,
};

export function Markdown({ content }: { content: string }) {
  return (
    <div className="text-ink/80">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
