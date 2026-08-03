import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";

import {
  getOrCreateWorkspace,
  getUserByEmail,
  upsertOAuthUser,
  verifyPassword,
} from "@/lib/auth/users";

/**
 * Auth.js (Milestone 2) — email+password + Google, backed by Neon.
 *
 * Active only where Auth.js is the auth backend (USE_AUTHJS, i.e. the
 * Netlify/Neon deploy). The existing Supabase path (Vercel) is untouched.
 *
 * - Credentials: bcrypt-checked email+password (users created via /api/auth/register).
 * - Google: dormant until GOOGLE_CLIENT_ID/SECRET are set, then it appears.
 * - JWT sessions (no session table); each user's workspace id rides on the token.
 */

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "")
        .trim()
        .toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      const user = await getUserByEmail(email);
      if (!user?.passwordHash) return null;
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
      };
    },
  }),
];

if (googleEnabled) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    // Google users may not yet have a Neon row — create it and pin the id.
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const dbUser = await upsertOAuthUser({
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        });
        user.id = dbUser.id;
      }
      return true;
    },
    // Stamp the user id + their workspace id onto the token (once, at sign-in).
    async jwt({ token, user }) {
      if (user?.id) {
        token.uid = user.id;
        token.wsid = await getOrCreateWorkspace(
          user.id,
          user.name || user.email || "My",
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      if (token.wsid) session.user.workspaceId = token.wsid as string;
      return session;
    },
  },
});
