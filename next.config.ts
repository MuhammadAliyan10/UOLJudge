import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [], // No remote images allowed (offline/LAN only)
    unoptimized: true,  // Disable optimization for offline compatibility
  },
};

export default nextConfig;
