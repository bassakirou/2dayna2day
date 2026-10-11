import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const isProd = process.env.NODE_ENV === "production";
const isLocal = !isProd || process.env.STATIC_EXPORT_TARGET === "local";

if (isProd) {
  require('./scripts/validate-env.cjs')(process.env);
}

if (isLocal) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  experimental: { cpus: 4 },
  distDir: isProd ? ".next" : ".next-dev",
  output: isProd ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: isProd,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin2dayna2day.goldenbackapparel.com",
      },
      {
        protocol: "https",
        hostname: "*.ngrok-free.dev",
      },
      {
        protocol: "http",
        hostname: "2dayna2day.test",
      },
      {
        protocol: "https",
        hostname: "2dayna2day.test",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
