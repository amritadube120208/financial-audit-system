/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Proxy all backend routes through port 3000 — single localhost URL
  async rewrites() {
    return [
      { source: "/api/:path*",    destination: `${BACKEND_URL}/api/:path*` },
      { source: "/healthz",       destination: `${BACKEND_URL}/healthz` },
      { source: "/readyz",        destination: `${BACKEND_URL}/readyz` },
      { source: "/docs",          destination: `${BACKEND_URL}/docs` },
      { source: "/openapi.json",  destination: `${BACKEND_URL}/openapi.json` },
    ];
  },
};

export default nextConfig;

