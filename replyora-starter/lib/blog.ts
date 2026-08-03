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
    slug: "after-hours-enquiries",
    title: "The after-hours enquiry problem (and what it's really costing you)",
    excerpt:
      "Most service-business enquiries arrive when you're closed. Here's the maths on what slow replies cost — and how to fix it.",
    date: "2026-06-24",
    readMins: 4,
    tag: "Playbook",
    body: [
      "If you run a clinic, salon or agency, look at when your enquiries actually land. For most local businesses, 40–60% arrive outside opening hours — evenings, weekends, lunch breaks.",
      "The problem isn't that people aren't interested. It's that interest is perishable. A visitor who asks 'how much for a HydraFacial?' at 9pm will book with whoever answers first — and by morning, that's rarely you.",
      "An always-on assistant flips this. It answers instantly from your pricing and policies, captures the lead, and offers a time — turning a 9pm question into a Saturday booking before a competitor ever sees it.",
      "The best part: these are customers you were already attracting. You're not spending more on marketing — you're just stopping the leak at the bottom of the funnel.",
    ],
  },
  {
    slug: "answer-vs-book",
    title: "Deflection is the wrong metric",
    excerpt:
      "Chatbots brag about 'tickets deflected'. For a service business, the only metric that matters is bookings.",
    date: "2026-06-17",
    readMins: 3,
    tag: "Opinion",
    body: [
      "Enterprise chatbots optimise for deflection — resolving a query so a human doesn't have to. That makes sense when every ticket is a cost.",
      "But for a physio or a salon, a query isn't a cost. It's a customer raising their hand. 'Deflecting' them is the last thing you want.",
      "Replyora is built around the opposite goal: every conversation should move toward a booked appointment. Answer the question, yes — then qualify, capture, and book.",
    ],
  },
  {
    slug: "week-1-build-log",
    title: "Build log: our first pilot week",
    excerpt:
      "Shipping in public. What we learned putting Replyora in front of a real clinic for seven days.",
    date: "2026-06-10",
    readMins: 5,
    tag: "Build in public",
    body: [
      "We put the first version live on a Manly skin clinic's site on a Monday. By Sunday it had handled 47 conversations and captured 11 leads — most of them after hours.",
      "The biggest surprise: people happily gave their details when the assistant offered to hold a Saturday slot. Booking intent was the unlock, not the answer itself.",
      "What we changed after week one: shorter replies, an earlier ask for contact details, and a clearer hand-off when the visitor wanted something only a human could confirm.",
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
