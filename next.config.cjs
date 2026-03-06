/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Hosting requires a server-side application (not static export)
  // Remove "output: export" to enable server components, API routes, and middleware
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
