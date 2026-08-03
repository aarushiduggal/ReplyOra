import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col bg-cream">
        <div className="p-6">
          <Logo height={30} />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          {children}
        </div>
      </div>

      {/* Brand side */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-oxblood p-12 text-cream lg:flex">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-rose/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-wine/60 blur-3xl" />
        <div className="relative">
          <Logo asLink={false} tone="inverted" height={30} />
        </div>
        <blockquote className="relative max-w-md">
          <p className="font-display text-3xl leading-snug">
            “It captured eleven leads in our first weekend — bookings we&apos;d
            have lost to voicemail.”
          </p>
          <footer className="mt-6 text-sm text-cream/80">
            Amara Nguyen · Coastal Glow Skin Clinic, Manly
          </footer>
        </blockquote>
        <div className="relative text-sm text-cream/70">
          <Link href="/" className="hover:text-cream">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
