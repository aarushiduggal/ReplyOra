import { HeroStack } from "@/components/marketing/social/hero-stack";
import { PlatformMarquee } from "@/components/marketing/social/platform-marquee";
import { TwoProducts } from "@/components/marketing/social/two-products";
import { MeetFounder } from "@/components/marketing/social/meet-founder";
import { HowDemo } from "@/components/marketing/social/how-demo";
import { ImpactStats } from "@/components/marketing/social/impact-stats";
import { BookCallCta } from "@/components/marketing/social/book-call-cta";

export default function LandingPage() {
  return (
    <>
      <HeroStack />

      <PlatformMarquee />

      <TwoProducts />

      <MeetFounder />

      <HowDemo />

      <ImpactStats />

      <BookCallCta />
    </>
  );
}
