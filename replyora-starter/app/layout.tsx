import type { Metadata } from "next";
import Script from "next/script";
import { Playfair_Display, Montserrat, Fredoka } from "next/font/google";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://replyora.com";
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

const TITLE =
  "Replyora — AI that replies, captures leads, and books customers 24/7";
const DESCRIPTION =
  "An AI customer-conversation platform for small & medium service businesses. Replyora replies instantly, captures leads, qualifies enquiries, and books customers — around the clock.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Replyora",
  },
  description: DESCRIPTION,
  applicationName: "Replyora",
  icons: {
    icon: [{ url: "/brand/favicon.png", type: "image/png" }],
    apple: [{ url: "/brand/replyora-badge.png" }],
  },
  keywords: [
    "AI chatbot",
    "lead capture",
    "customer conversations",
    "booking assistant",
    "service business",
    "Chatbase alternative",
  ],
  openGraph: {
    type: "website",
    siteName: "Replyora",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${playfair.variable} ${fredoka.variable}`}
      >
        {children}
        {PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.tagged-events.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
