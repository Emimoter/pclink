import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://pclink-f6e0d.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
