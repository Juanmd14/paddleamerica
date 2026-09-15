import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos subidas a Supabase Storage (buckets públicos)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
