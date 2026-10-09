import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Merchants paste image URLs from any host and we store product photos
    // on Vercel Blob (*.public.blob.vercel-storage.com), so allow any https
    // image source. Locally-uploaded files are served same-origin from
    // /api/uploads and need no pattern.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
