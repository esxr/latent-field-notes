import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/chat": [
      "./node_modules/@anthropic-ai/claude-agent-sdk/cli.js",
      "./node_modules/@anthropic-ai/claude-agent-sdk/*.wasm",
    ],
    "*": ["./blogs/**/*", "./storage/**/*"],
  },
};

export default nextConfig;
