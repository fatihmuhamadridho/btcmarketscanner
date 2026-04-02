import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  devIndicators: false,
  env: {
    APP_VERSION: process.env.npm_package_version,
    BASE_API_BINANCE: process.env.BASE_API_BINANCE,
    BASE_API_WEBSOCKET_BINANCE: process.env.BASE_API_WEBSOCKET_BINANCE,
    BINANCE_API_KEY: process.env.BINANCE_API_KEY,
    BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY,
  },
  allowedDevOrigins: ['192.168.1.7'],
};

export default nextConfig;
