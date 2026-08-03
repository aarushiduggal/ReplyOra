import type { LucideIcon } from "lucide-react";
import {
  Zap,
  Route,
  Calculator,
  MessageSquareText,
  Activity,
  Scissors,
  Home,
  Handshake,
  BookOpen,
  Newspaper,
  HelpCircle,
  CalendarCheck,
} from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavLink[];
}

/** Standalone links shown directly on the header bar (no dropdown). */
export interface TopLink {
  label: string;
  href: string;
}

/** Shared marketing nav structure — used by the desktop mega-menus and the
 * mobile accordion so they never drift. Every href routes to a real page/section. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Product",
    items: [
      {
        label: "Features",
        href: "/#features",
        description: "Reply, capture, qualify and book — the lead engine.",
        icon: Zap,
      },
      {
        label: "How it works",
        href: "/#how",
        description: "Live in minutes: train, customise, embed.",
        icon: Route,
      },
      {
        label: "ROI calculator",
        href: "/roi",
        description: "See what slow replies cost you each month.",
        icon: Calculator,
      },
      {
        label: "Live demo",
        href: "/#product",
        description: "Try the assistant right on the homepage.",
        icon: MessageSquareText,
      },
    ],
  },
  {
    label: "Industries",
    items: [
      {
        label: "Physiotherapy",
        href: "/for/physio",
        description: "Triage injuries, answer rebates, book assessments.",
        icon: Activity,
      },
      {
        label: "Salons & beauty",
        href: "/for/salons",
        description: "Quote services and fill quiet appointment slots.",
        icon: Scissors,
      },
      {
        label: "Real estate",
        href: "/for/real-estate",
        description: "Qualify buyers and renters, book inspections.",
        icon: Home,
      },
      {
        label: "NDIS providers",
        href: "/for/ndis",
        description: "Explain supports and capture referrals.",
        icon: Handshake,
      },
    ],
  },
  {
    label: "Company",
    items: [
      {
        label: "Our story",
        href: "/story",
        description: "Why we're building Replyora, in the open.",
        icon: BookOpen,
      },
      {
        label: "Blog",
        href: "/blog",
        description: "Playbooks and build-in-public notes.",
        icon: Newspaper,
      },
      {
        label: "FAQ",
        href: "/faq",
        description: "Answers to the questions owners ask most.",
        icon: HelpCircle,
      },
      {
        label: "Book a demo",
        href: "/demo",
        description: "See Replyora on your business in 20 minutes.",
        icon: CalendarCheck,
      },
    ],
  },
];

/** Promoted to the header bar as plain links (kept out of the dropdowns). */
export const TOP_LINKS: TopLink[] = [
  { label: "Compare", href: "/compare" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Pricing", href: "/#pricing" },
];
