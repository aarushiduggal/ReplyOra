/** Single source of truth for site + brand + founder identity. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://replyora.net";

export const IG_URL = "https://www.instagram.com/replyora/";

/** The only public contact email — used across legal pages, footer, demo, etc. */
export const CONTACT_EMAIL = "hello.replyora@gmail.com";

export const FOUNDER = {
  name: "Aarushi",
  jobTitle: "Founder",
  photo: "/marketing/founder.jpg",
  caption: "Founder, Replyora · building in public",
  ig: IG_URL,
} as const;

export const ORG_NAME = "Replyora";
export const ORG_DESCRIPTION =
  "Social media management for agencies and personal brands — plan, design, schedule and publish a month of on-brand content for Instagram, Facebook & TikTok, plus a website AI chatbox.";
