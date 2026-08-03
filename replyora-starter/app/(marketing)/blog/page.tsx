import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BLOG_POSTS } from "@/lib/blog";
import { formatDate } from "@/lib/format";
import { FOUNDER } from "@/lib/site";
import { Reveal } from "@/components/marketing/motion";

export const metadata = {
  title: "Blog",
  description:
    "Playbooks and build-in-public notes on turning enquiries into booked customers.",
};

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Reveal className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-rose">
          Blog
        </p>
        <h1 className="mt-3 font-display text-4xl text-oxblood">
          Playbooks & build-in-public notes
        </h1>
      </Reveal>

      <div className="mt-12 space-y-4">
        {BLOG_POSTS.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.06}>
          <Link
            href={`/blog/${p.slug}`}
            className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-oxblood/40 hover:bg-oat/30"
          >
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-oat px-2 py-0.5 font-medium text-wine">
                {p.tag}
              </span>
              {formatDate(p.date)} · {p.readMins} min read · by {FOUNDER.name}
            </div>
            <h2 className="mt-3 font-display text-2xl text-ink">{p.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-oxblood">
              Read more
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
