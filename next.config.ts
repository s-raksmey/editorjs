import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-caac68c4d1614d4895247250dc2543f3.r2.dev',
      },
    ],
  },
  reactStrictMode: false,
};

export default nextConfig;
