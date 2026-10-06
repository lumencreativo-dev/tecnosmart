import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},

  images: {
    remotePatterns: [
      // Supabase Storage
      { protocol: "https", hostname: "**.supabase.co" },
      // Unsplash stock photos
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
