import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, Magnetic } from "@/components/marketing/motion";

type Cell = boolean | "partial" | string;

const COLUMNS = ["Replyora", "Chatbase", "ManyChat"];

const ROWS: { feature: string; values: Cell[] }[] = [
  { feature: "Answers from your knowledge base (RAG)", values: [true, true, "partial"] },
  { feature: "Lead capture & qualification built-in", values: [true, "partial", true] },
  { feature: "Hot/warm/cold lead scoring", values: [true, false, false] },
  { feature: "Native booking flow", values: [true, false, "partial"] },
  { feature: "Website widget", values: [true, true, true] },
  { feature: "Human takeover", values: [true, false, true] },
  { feature: "Follow-up automation", values: [true, false, true] },
  { feature: "Analytics: lead & booking funnel", values: [true, "partial", "partial"] },
  { feature: "Built for local service businesses", values: [true, false, false] },
  { feature: "Done-for-you templates by niche", values: [true, false, "partial"] },
];

export const metadata = {
  title: "Replyora vs Chatbase vs ManyChat",
  description:
    "See how Replyora compares to Chatbase and ManyChat — the lead engine built for local service businesses.",
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Reveal className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-rose">
          Comparison
        </p>
        <h1 className="mt-3 font-display text-4xl text-oxblood">
          How Replyora compares
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Chatbase answers questions. ManyChat automates social. Replyora is the
          lead engine built for local service businesses — answer, qualify, book.
        </p>
      </Reveal>

      <Reveal className="mt-12 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-oat/50">
              <th className="p-4 text-left font-medium text-ink">Feature</th>
              {COLUMNS.map((c, i) => (
                <th
                  key={c}
                  className={`p-4 text-center font-display text-lg ${
                    i === 0 ? "text-oxblood" : "text-ink/70"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.feature} className="border-b border-border last:border-0">
                <td className="p-4 text-ink/80">{row.feature}</td>
                {row.values.map((v, i) => (
                  <td key={i} className="p-4 text-center">
                    <CellMark value={v} highlight={i === 0} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      <Reveal className="mt-10 text-center">
        <Magnetic strength={0.35}>
          <Button asChild size="lg">
            <Link href="/signup">Start your 7-day trial</Link>
          </Button>
        </Magnetic>
      </Reveal>
    </div>
  );
}

function CellMark({ value, highlight }: { value: Cell; highlight: boolean }) {
  if (value === true) {
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
          highlight ? "bg-oxblood text-cream" : "bg-emerald-100 text-emerald-700"
        }`}
      >
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" />;
  }
  if (value === "partial") {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        Partial
      </span>
    );
  }
  return <span className="text-ink/70">{value}</span>;
}
