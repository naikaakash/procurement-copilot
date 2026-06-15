import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Container-friendly self-contained build (.next/standalone/server.js).
  // Required by our Docker runner stage.
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
