import { BlogTimeline } from "@/components/marketing/blog/blog-timeline";

export const metadata = {
  title: "Blog · Replyora",
  description:
    "The Replyora build log — playbooks and build-in-public notes on planning, creating and scheduling social content for Instagram & TikTok.",
};

export default function BlogIndexPage() {
  return <BlogTimeline />;
}
