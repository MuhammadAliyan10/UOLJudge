import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [], // No remote images allowed (offline/LAN only)
    unoptimized: true,  // Disable optimization for offline compatibility
  },
};

export default nextConfig;
