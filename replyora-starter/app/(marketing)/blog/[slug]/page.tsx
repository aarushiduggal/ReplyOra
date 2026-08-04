import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BLOG_POSTS, getPost } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { FounderPhoto } from "@/components/marketing/founder-photo";
import { formatDate } from "@/lib/format";
import { FOUNDER, IG_URL, ORG_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: FOUNDER.name, url: SITE_URL }],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      authors: [FOUNDER.name],
      publishedTime: new Date(post.date).toISOString(),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: new Date(post.date).toISOString(),
    image: `${SITE_URL}/opengraph-image`,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    author: {
      "@type": "Person",
      name: FOUNDER.name,
      url: SITE_URL,
      sameAs: [IG_URL],
    },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/opengraph-image`,
      },
    },
  };

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-oxblood"
      >
        <ArrowLeft className="h-4 w-4" />
        All posts
      </Link>

      <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="rounded-full bg-oat px-2 py-0.5 font-medium text-wine">
          {post.tag}
        </span>
        {formatDate(post.date)} · {post.readMins} min read
      </div>
      <h1 className="mt-3 font-display text-4xl leading-tight text-oxblood">
        {post.title}
      </h1>

      {/* Author byline */}
      <div className="mt-5 flex items-center gap-3 border-b border-border pb-6">
        <FounderPhoto
          src={FOUNDER.photo}
          alt={`${FOUNDER.name}, founder of Replyora`}
          initial={FOUNDER.name.charAt(0)}
          size={44}
          rounded="rounded-full"
        />
        <div className="text-sm">
          <p className="font-medium text-ink">{FOUNDER.name}</p>
          <p className="text-xs text-muted-foreground">
            {FOUNDER.jobTitle}, Replyora ·{" "}
            <a
              href={IG_URL}
              target="_blank"
              rel="noreferrer"
              className="text-oxblood hover:underline"
            >
              @replyora
            </a>
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-5 leading-relaxed text-ink/80">
        {post.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-oat/50 p-8 text-center">
        <h2 className="font-display text-2xl text-oxblood">
          Try it on your business
        </h2>
        <Button asChild className="mt-4">
          <Link href="/signup">Start your free trial</Link>
        </Button>
      </div>
    </article>
  );
}
