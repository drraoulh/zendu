import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dossier de build distinct si besoin (plusieurs serveurs locaux en parallèle). Vercel : ".next".
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "flagcdn.com" }],
  },
  poweredByHeader: false,
};

export default nextConfig;
