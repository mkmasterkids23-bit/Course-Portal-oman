import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Puppeteer ships native binaries that must not be bundled by webpack.
  // This tells Next.js to resolve them at runtime from node_modules instead.
  serverExternalPackages: ["puppeteer", "@prisma/client"],
};

export default nextConfig;
