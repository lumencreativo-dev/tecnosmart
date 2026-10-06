import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 usa Turbopack por defecto
  // @react-pdf/renderer es client-only — no requiere configuración especial en Turbopack
  turbopack: {},

  // Permite imágenes desde Supabase Storage
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
