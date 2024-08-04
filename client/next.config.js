const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

/** @type {import('next').NextConfig} */
module.exports = (phase) => ({
  reactStrictMode: true,
  async rewrites() {
    if (phase==PHASE_DEVELOPMENT_SERVER) return [
      { source: '/api/:path*', destination: `${process.env["SERVER_URL"]}/:path*` },
    ]
    else return [];
  }
});