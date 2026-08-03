import type { DefaultSession } from "next-auth";

/**
 * Extend Auth.js types with the fields we stamp on the session/token:
 * the Neon user id and the user's workspace id.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      workspaceId: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    wsid?: string;
  }
}
