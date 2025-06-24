import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
