import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Single-threaded page generation avoids Windows multi-worker file-lock EPERM collisions
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
