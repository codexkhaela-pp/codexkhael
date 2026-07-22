import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/diario/export': ['./src/image/**/*', './src/fonts/**/*'],
  },
};

export default nextConfig;
