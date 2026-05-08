import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["www.38.co.kr", "38.co.kr"],
    },
  },
};

export default nextConfig;