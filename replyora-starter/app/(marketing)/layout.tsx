import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { StructuredData } from "@/components/marketing/structured-data";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { ChatWidget } from "@/components/marketing/chat-widget";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div className="flex min-h-screen flex-col bg-cream">
        <StructuredData />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ChatWidget />
      </div>
    </SmoothScroll>
  );
}
