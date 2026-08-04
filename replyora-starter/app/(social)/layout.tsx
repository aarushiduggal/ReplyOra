import { getCurrentUser } from "@/lib/auth/session";
import { PortalTopNav } from "@/components/social/portal-topnav";
import { PortalFooter } from "@/components/social/portal-footer";
import { TodoPill } from "@/components/social/todo-pill";
import { ClientNameProvider } from "@/components/social/client-name-context";
import { GuideProvider } from "@/components/social/guide";

/**
 * replyora Social portal shell — Entire Socials-style editorial layout in the
 * replyora palette: white background, oxblood accents, Playfair headings,
 * uppercase letter-spaced micro-labels, lots of whitespace and hairline rules.
 * Gated by getCurrentUser() (redirects to /login when signed out).
 */
export default async function SocialPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getCurrentUser();

  return (
    <ClientNameProvider>
      <GuideProvider>
        <div className="flex min-h-screen flex-col bg-white text-ink">
          <PortalTopNav />
          <main className="flex-1">{children}</main>
          <PortalFooter />
          <TodoPill />
        </div>
      </GuideProvider>
    </ClientNameProvider>
  );
}
