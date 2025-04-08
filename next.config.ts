import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable persistent caching in development
  webpack: (config, { dev }) => {
    if (dev) {
      // Use memory cache instead of filesystem in development
      config.cache = {
        type: 'memory',
        cacheUnaffected: true,
      };
    }
    return config;
  },
  // Prevent throttling for file changes
  onDemandEntries: {
    // Keep pages in memory for 5 minutes
    maxInactiveAge: 300 * 1000,
    // Limit total pages in cache
    pagesBufferLength: 5,
  },
  // Improve error handling
  reactStrictMode: true,
  // Simplified experimental section
  experimental: {}
};

export default nextConfig;
