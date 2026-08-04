/** A standalone link shown directly on the marketing header bar. */
export interface TopLink {
  label: string;
  href: string;
}

/**
 * Marketing top nav — deliberately lean: Product · Pricing · Work.
 * ("Log in" is rendered separately as a button in the header/mobile menu.)
 */
export const TOP_LINKS: TopLink[] = [
  { label: "Product", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Work", href: "/demo" },
];
