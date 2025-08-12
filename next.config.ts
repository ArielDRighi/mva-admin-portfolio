import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuración para producción
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://admin.mvasrl.com' : '',
  publicRuntimeConfig: {
    basePath: process.env.NODE_ENV === 'production' ? 'https://admin.mvasrl.com' : '',
  },
};

export default nextConfig;
