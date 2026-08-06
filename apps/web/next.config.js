/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for the Docker image (see apps/web/Dockerfile) — bundles
  // only the production node_modules subset a running server needs.
  output: "standalone",
  reactStrictMode: true,
};

module.exports = nextConfig;
