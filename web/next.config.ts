import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dossier de build distinct si besoin (plusieurs serveurs locaux en parallèle). Vercel : ".next".
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "flagcdn.com" }],
  },
  poweredByHeader: false,
  // Logo embarqué dans le reçu PDF (lu sur disque par la fonction serveur).
  outputFileTracingIncludes: {
    "/api/transfers/[id]/receipt/pdf": ["./public/brand/wst/logo-horizontal@2x.png"],
  },
};

export default nextConfig;
