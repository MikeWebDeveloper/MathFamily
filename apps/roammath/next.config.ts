import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mathfamily/ui", "@mathfamily/engine", "@mathfamily/data", "@mathfamily/geo"]
};

export default nextConfig;
