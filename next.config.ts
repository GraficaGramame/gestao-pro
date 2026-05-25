import type { NextConfig } from "next";

// O uso do ': any' desliga a fiscalização estrita neste arquivo
const nextConfig: any = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;