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
    ],
  },
};

module.exports = nextConfig;
