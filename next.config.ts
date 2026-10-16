import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mehrere Fotos pro Anzeige (je max. 8 MB) per Server Action
  experimental: { serverActions: { bodySizeLimit: "70mb" } },
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
