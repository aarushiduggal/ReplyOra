/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-only secrets (service role, Stripe, Anthropic/OpenAI) must never be
  // bundled client-side — keep them out of NEXT_PUBLIC_* and read them only in
  // route handlers / server components.
  reactStrictMode: true,
  // Move the dev-only indicator off the bottom-left so it can't overlap the
  // sidebar footer link.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
