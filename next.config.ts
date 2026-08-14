import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  images: process.env.STATIC_EXPORT === 'true' ? { unoptimized: true } : undefined,
  basePath: basePath || undefined,
};

export default nextConfig;
