import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/milgot-students",
  trailingSlash: true,
};

export default nextConfig;
