import type { Metadata } from "next";
import Script from "next/script";
import { Playfair_Display, Fraunces, Archivo, Archivo_Black } from "next/font/google";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://replyora.com";
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

// Editorial serif — used ONLY for the wordmark's italic "reply", so load the
// italic style alone (drops the unused normal-style file).
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
  variable: "--font-playfair",
  display: "swap",
});

// Engaging display serif for headlines across the app.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// Body / UI.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-archivo",
  display: "swap",
});

// Heavy: the wordmark's "ora.", eyebrows, buttons and labels.
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
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
  // Favicon + apple icon are generated from app/icon.tsx + app/apple-icon.tsx.
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
