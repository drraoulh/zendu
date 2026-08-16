import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "flagcdn.com" }],
  },
  poweredByHeader: false,
};

export default nextConfig;
