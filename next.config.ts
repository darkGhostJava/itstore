
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'https://materiel.dg.dse',
    'https://materiel.dg.dse:9002',
    'http://materiel.dg.dse:9001',
    'https://materiel.dg.dse:8081',
    'https://keycloak.dg.dse:3002', // ← no trailing slash
  ],
  // Source - https://stackoverflow.com/a
// Posted by kondziorf
// Retrieved 2025-12-01, License - CC BY-SA 4.0

reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
  
};

export default nextConfig;
