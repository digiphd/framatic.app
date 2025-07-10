import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Handle react-native-reanimated module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native-reanimated': 'react-native-reanimated/lib/commonjs/index.js',
    };
    
    // Ignore reanimated module imports in server-side rendering
    config.externals = config.externals || [];
    config.externals.push('react-native-reanimated');
    
    return config;
  },
  experimental: {
    esmExternals: false,
  },
};

export default nextConfig;
