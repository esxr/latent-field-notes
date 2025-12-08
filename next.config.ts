import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "*": ["./blogs/**/*"],
  },
};

export default nextConfig;
