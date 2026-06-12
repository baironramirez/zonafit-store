import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["jose", "jwks-rsa", "firebase-admin"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
