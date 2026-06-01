/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint and typecheck are run separately (npm run lint / npm run typecheck).
  // Don't block production builds on them — the SWC compile is the source of truth.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
