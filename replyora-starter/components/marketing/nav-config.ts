/** A link shown on the marketing header bar, optionally with a hover menu. */
export interface NavChild {
  label: string;
  href: string;
  desc?: string;
}

export interface TopLink {
  label: string;
  href: string;
  children?: NavChild[];
}

/**
 * Marketing top nav — flat links, no dropdowns.
 * "Product" is the combined product-tour + website-chatbox page.
 * About lives on the homepage (Meet the founder); Book a call is the homepage
 * footer CTA — so neither needs a nav slot.
 */
export const TOP_LINKS: TopLink[] = [
  { label: "Product", href: "/product" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },
];
