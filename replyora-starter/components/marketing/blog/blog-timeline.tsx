"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { BLOG_POSTS } from "@/lib/blog";
import { formatDate } from "@/lib/format";
import { FOUNDER } from "@/lib/site";
import { SocialLinks } from "@/components/marketing/social-links";

/** Blog layout 2 — a build-in-public timeline: a drawn line + dated entries. */

export function BlogTimeline() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-col items-center text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
          Building in public
        </p>
        <h1 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
          The Replyora build log
        </h1>
        <p className="mt-3 text-sm text-ink/60">
          Notes, playbooks and what we&apos;re shipping — follow along:
        </p>
        <SocialLinks className="mt-3" />
      </div>

      <div className="relative mt-14 pl-8">
        {/* the line */}
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute left-[7px] top-2 bottom-2 w-px origin-top bg-oxblood/25"
        />

        <div className="space-y-8">
          {BLOG_POSTS.map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="relative"
            >
              <span className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-oxblood bg-cream" />
              <div className="flex items-center gap-2 text-xs text-ink/55">
                <span className="rounded-full bg-oat px-2 py-0.5 font-medium text-wine">
                  {p.tag}
                </span>
                {formatDate(p.date)} · {p.readMins} min read · by {FOUNDER.name}
              </div>
              <Link href={`/blog/${p.slug}`} className="group mt-2 block">
                <h2 className="font-display text-2xl text-ink transition-colors group-hover:text-oxblood">
                  {p.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">
                  {p.excerpt}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-oxblood">
                  Read more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
