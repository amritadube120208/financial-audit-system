/** @type {import('next').NextConfig} */
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://financial-audit-system.onrender.com"
    : "http://127.0.0.1:8000");

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://financial-audit-system.onrender.com"
        : "http://127.0.0.1:8000"),
  },

  // Proxy backend routes through Next.js
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/healthz", destination: `${BACKEND_URL}/healthz` },
      { source: "/readyz", destination: `${BACKEND_URL}/readyz` },
      { source: "/docs", destination: `${BACKEND_URL}/docs` },
      { source: "/openapi.json", destination: `${BACKEND_URL}/openapi.json` },
    ];
  },
};

export default nextConfig;
