import type { NextConfig } from "next";

const supabaseHostname = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
})();

const remotePatterns = [
  { protocol: "https" as const, hostname: "crests.football-data.org" },
  { protocol: "https" as const, hostname: "flagcdn.com" },
];

if (supabaseHostname) remotePatterns.push({ protocol: "https" as const, hostname: supabaseHostname });

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
