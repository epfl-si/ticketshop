import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/cgi-bin/artifactServer',
        destination: '/api/artifactServer',
      },
    ]
  },
};

export default nextConfig;
