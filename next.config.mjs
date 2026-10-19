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
  // Desde el 2026-10-19 la tienda y el plan de novios viven en Well Me (wellme.ec); Pau se
  // queda con los talleres. Redirecciones temporales (307) mientras se confirma que Well Me
  // cobra bien; después pueden pasar a permanentes. Las rutas /api no se tocan: los avisos
  // de Nuvei y el 3DS de pedidos viejos siguen llegando aquí.
  async redirects() {
    const WM = "https://wellme.ec";
    return [
      { source: "/tienda", has: [{ type: "query", key: "tab", value: "catalogo" }], destination: `${WM}/carico`, permanent: false },
      { source: "/tienda", destination: `${WM}/tienda`, permanent: false },
      { source: "/tienda/:id", destination: `${WM}/tienda`, permanent: false },
      { source: "/checkout", destination: `${WM}/tienda`, permanent: false },
      { source: "/checkout/:path*", destination: `${WM}/tienda`, permanent: false },
      { source: "/plan-novios", destination: `${WM}/plan-novios`, permanent: false },
      { source: "/plan-novios/:path*", destination: `${WM}/plan-novios/:path*`, permanent: false },
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
