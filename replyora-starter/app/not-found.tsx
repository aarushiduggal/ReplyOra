import Link from "next/link";
import { ArrowLeft, Home, LifeBuoy } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(120%_90%_at_50%_0%,#F3ECDD_0%,rgba(243,236,221,0)_55%)] bg-cream px-6 text-center">
      <Logo height={30} />
      <p className="mt-10 font-display text-[5rem] leading-none text-oxblood sm:text-[7rem]">
        404
      </p>
      <h1 className="mt-2 font-display text-3xl text-oxblood">
        This page went off-script.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        The page you&apos;re after doesn&apos;t exist or has moved. Let&apos;s get
        you back to something useful.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Go to dashboard
          </Link>
        </Button>
      </div>
      <p className="mt-6 flex items-center gap-1.5 text-sm text-ink/60">
        <LifeBuoy className="h-4 w-4" />
        Lost? <Link href="/demo" className="text-oxblood hover:underline">Book a quick demo</Link>
      </p>
    </div>
  );
}
