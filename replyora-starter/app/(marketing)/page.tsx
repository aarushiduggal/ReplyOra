// Editorial-split hero. To revert to the fanned card stack, swap this import
// and the <HeroSplit /> below back to HeroStack — hero-stack.tsx is untouched.
import { HeroSplit } from "@/components/marketing/social/hero-split";
import { PlatformMarquee } from "@/components/marketing/social/platform-marquee";
import { TwoProducts } from "@/components/marketing/social/two-products";
import { MeetFounder } from "@/components/marketing/social/meet-founder";
import { HowDemo } from "@/components/marketing/social/how-demo";
import { ImpactStats } from "@/components/marketing/social/impact-stats";
import { BookCallCta } from "@/components/marketing/social/book-call-cta";

export default function LandingPage() {
  // Gentle porcelain → blush → sky rhythm down the page; hero + marquee stay on
  // the porcelain base, the CTA keeps its ink ground.
  return (
    <>
      <HeroSplit />

      <PlatformMarquee />

      <div className="bg-blush">
        <TwoProducts />
      </div>

      <MeetFounder />

      <div className="bg-sky">
        <HowDemo />
      </div>

      <div className="bg-blush">
        <ImpactStats />
      </div>

      <BookCallCta />
    </>
  );
}
