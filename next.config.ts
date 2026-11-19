import type { NextConfig } from "next";

const nextConfig: NextConfig = {
<<<<<<< HEAD
  output: "standalone",
=======
>>>>>>> ab4267bd3264cc1761ceb73cdc6359acac4f30f2
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
