export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readMins: number;
  tag: string;
  body: string[];
}

/** Static blog content for the prototype. // TODO: replace with a CMS. */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "month-of-content-one-sitting",
    title: "How to plan a month of content in one sitting",
    excerpt:
      "Batching beats posting-in-a-panic. The exact workflow to plan, write and schedule 30 days of content in an afternoon.",
    date: "2026-07-22",
    readMins: 5,
    tag: "Playbook",
    body: [
      "The reason content feels relentless isn't the work — it's the context-switching. Writing one caption at 11pm, designing a post the next morning, scrambling for a reel idea on Friday. Batching kills that.",
      "Block one afternoon. Start with the month view, drop in your key dates and launches, then fill the gaps with your content pillars — behind-the-scenes, education, social proof, offers.",
      "Generate captions for the whole batch at once so your voice stays consistent, arrange them on the grid so the feed looks cohesive, and schedule the lot. Then close the tab.",
      "Do this once a month and 'keeping up with content' stops being a daily tax — it becomes a two-hour ritual.",
    ],
  },
  {
    slug: "consistency-beats-virality",
    title: "Consistency beats virality — every time",
    excerpt:
      "One viral post won't save a quiet account. Showing up on schedule will. Why the algorithm rewards the reliable.",
    date: "2026-07-15",
    readMins: 3,
    tag: "Opinion",
    body: [
      "Everyone wants the viral moment. But chase virality and you'll post erratically, burn out, and go quiet for three weeks when it doesn't land.",
      "The accounts that actually grow are boringly consistent. They show up two or three times a week, on brand, whether or not the last post did numbers.",
      "Consistency is a systems problem, not a motivation problem. Plan the month, schedule it, and 'showing up' happens on autopilot — even in your busiest weeks.",
    ],
  },
  {
    slug: "first-pilot-week",
    title: "Build log: our first pilot week",
    excerpt:
      "Shipping in public. What we learned putting Replyora in front of a real brand studio for seven days.",
    date: "2026-07-08",
    readMins: 5,
    tag: "Build in public",
    body: [
      "We put the first version live with a small brand studio on a Monday. By Sunday they'd planned and scheduled a full month of Instagram and TikTok — in one sitting.",
      "The biggest surprise: the grid planner did more for confidence than the captions. Seeing the whole feed before posting was the thing that made people hit 'schedule'.",
      "What we changed after week one: faster caption generation, a clearer month view, and one-tap client approvals — an agency asked for it on day three.",
    ],
  },
  {
    slug: "design-your-feed-first",
    title: "Design your feed before you post a thing",
    excerpt:
      "A grid-first workflow: arrange the whole feed visually, lock the aesthetic, then fill in the words. Your profile will thank you.",
    date: "2026-07-01",
    readMins: 4,
    tag: "Playbook",
    body: [
      "Most people post one image at a time and hope the grid looks good. It rarely does — colours clash, three selfies land in a row, the vibe wanders.",
      "Flip it. Start with the grid: drop your planned posts into a nine-up view and rearrange until the whole thing looks intentional. Balance photos, carousels and reels.",
      "Only then write the captions. When the feed is designed first, every new post has a place to slot into — and your profile reads like a brand, not a camera roll.",
    ],
  },
  {
    slug: "captions-that-get-saved",
    title: "Captions that get saved, not scrolled past",
    excerpt:
      "The save is the new like. A simple formula for hooks and captions people actually keep — and send to a friend.",
    date: "2026-06-24",
    readMins: 4,
    tag: "Guide",
    body: [
      "Likes are vanity; saves and shares are the signals the algorithm actually rewards — and the ones that turn a follower into a customer.",
      "Open with a hook that promises something useful ('steal this 3-step routine'), deliver it in the body, and close with a soft call to act ('save this for your next restock').",
      "You don't need to be a copywriter. Feed your business and tone in once, generate a batch, and tweak the ones you love — consistency of voice does the rest.",
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
