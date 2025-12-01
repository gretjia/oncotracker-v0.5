import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/supabase/:path*',
        destination: 'http://127.0.0.1:54321/:path*',
      },
    ]
  },
};

export default nextConfig;
