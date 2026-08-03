import { handlers } from "@/auth";

// bcrypt + Neon run in the Node runtime, not edge.
export const runtime = "nodejs";

export const { GET, POST } = handlers;
