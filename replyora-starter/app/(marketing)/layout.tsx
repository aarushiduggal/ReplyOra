import { REPLYORA_SITE_KEY } from "@/lib/data/assistant";
import { getAvailableSlots } from "@/lib/data/bookings";
import { DEMO_ASSISTANT } from "@/lib/data/seed";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { StructuredData } from "@/components/marketing/structured-data";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { ChatBubble } from "@/components/widget/chat-bubble";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dogfood: Replyora's own assistant runs live on the marketing site, so it
  // both demonstrates the product and captures the site's own leads.
  const bookingSlots = await getAvailableSlots();

  return (
    <SmoothScroll>
      <div className="flex min-h-screen flex-col bg-cream">
        <StructuredData />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      <ChatBubble
        config={{
          publicKey: REPLYORA_SITE_KEY,
          name: "Replyora Assistant",
          welcomeMessage:
            "Hi 👋 I'm Replyora's own assistant — ask me anything about the product, pricing, or how it'd work for your business.",
          suggestedQuestions: [
            "How much does it cost?",
            "How does the free trial work?",
            "How does it install on my site?",
            "Can I book a demo?",
          ],
          brandColor: DEMO_ASSISTANT.brandColor,
          leadFields: DEMO_ASSISTANT.leadFields,
          businessName: "Replyora",
          showBranding: false,
          bookingSlots,
        }}
      />
      </div>
    </SmoothScroll>
  );
}
