import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin usa módulos nativos de Node.js (net, tls, http2, etc.)
  // que no existen en el entorno browser. serverExternalPackages le dice a
  // Next.js que NO intente incluirlo en el bundle del cliente, sino que lo
  // cargue en tiempo de ejecución en el servidor únicamente.
  serverExternalPackages: ["firebase-admin"],

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
