/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Hosting requires a server-side application (not static export)
  // Remove "output: export" to enable server components, API routes, and middleware
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  // /pago/t/<token> es la URL publica "bonita" del link de pago custom.
  // Internamente reutiliza /pago/toxica-sin-toxicos leyendo ?lt=<token>.
  async rewrites() {
    return [
      {
        source: "/pago/t/:token",
        destination: "/pago/toxica-sin-toxicos?lt=:token",
      },
    ];
  },
  // Allow cross-origin POST from bank ACS to 3DS callback
  async headers() {
    return [
      {
        source: "/api/payment/3ds-callback",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
