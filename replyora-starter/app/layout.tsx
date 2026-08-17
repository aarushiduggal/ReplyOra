import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://replyora.net";
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

// Fonts are SELF-HOSTED (app/fonts/*.woff2, Latin subset of the exact Google
// files) rather than fetched from Google Fonts at build time — that build-time
// fetch was rate-limited on the CI network and kept failing the deploy. Local
// files remove the network dependency entirely; the build can never fail on
// fonts again. Each family is a variable font, so one file covers its weights.

// Editorial serif — used ONLY for the wordmark's italic "reply".
const playfair = localFont({
  src: [{ path: "./fonts/playfair-italic.woff2", weight: "500 600", style: "italic" }],
  variable: "--font-playfair",
  display: "swap",
  fallback: ["Times New Roman", "serif"],
});

// Engaging display serif for headlines across the app.
const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-normal.woff2", weight: "400 600", style: "normal" },
    { path: "./fonts/fraunces-italic.woff2", weight: "400 600", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Times New Roman", "serif"],
});

// Body / UI.
const archivo = localFont({
  src: [{ path: "./fonts/archivo.woff2", weight: "400 500", style: "normal" }],
  variable: "--font-archivo",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

// Heavy: the wordmark's "ora.", eyebrows, buttons and labels.
const archivoBlack = localFont({
  src: [{ path: "./fonts/archivo-black.woff2", weight: "400", style: "normal" }],
  variable: "--font-archivo-black",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

const TITLE = "Replyora — Socials, simplified.";
const DESCRIPTION =
  "Socials, simplified. Replyora plans, designs, schedules and publishes a month of on-brand content for Instagram, Facebook & TikTok — plus a website AI chatbox.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Replyora",
  },
  description: DESCRIPTION,
  applicationName: "Replyora",
  // Favicon + apple icon come from app/icon.png + app/apple-icon.png (the real
  // replyora. wordmark). OG/social image from app/opengraph-image.tsx.
  keywords: [
    "social media management",
    "content planning",
    "Instagram scheduler",
    "social media agency tool",
    "content calendar",
    "AI captions",
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
        className={`${archivo.variable} ${fraunces.variable} ${playfair.variable} ${archivoBlack.variable}`}
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
