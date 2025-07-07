import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude web3 folder from Next.js compilation
  webpack: (config) => {
    // Ignore the web3 directory during compilation
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/web3/**', '**/node_modules/**'],
    };
    
    return config;
  },
  // Also exclude from TypeScript checking
  typescript: {
    // Ignore TypeScript errors in web3 folder during build
    ignoreBuildErrors: false,
  },
  // Exclude web3 from the build
  excludeDefaultMomentLocales: true,
};

export default nextConfig;
