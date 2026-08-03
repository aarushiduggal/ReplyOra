/** Single source of truth for site + brand + founder identity. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://replyora.com";

export const IG_URL = "https://www.instagram.com/replyora/";

/** The only public contact email — used across legal pages, footer, demo, etc. */
export const CONTACT_EMAIL = "hello.replyora@gmail.com";

export const FOUNDER = {
  name: "Aarushi",
  jobTitle: "Founder",
  photo: "/founder-aarushi.jpg",
  caption: "Founder, Replyora · building in public",
  ig: IG_URL,
} as const;

export const ORG_NAME = "Replyora";
export const ORG_DESCRIPTION =
  "AI customer-conversation platform for small & medium service businesses — replies instantly, captures leads, qualifies enquiries and books customers 24/7.";
