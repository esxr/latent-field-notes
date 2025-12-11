import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "*": ["./blogs/**/*", "./storage/**/*"],
  },
};

export default nextConfig;
