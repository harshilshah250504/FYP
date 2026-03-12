/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.openstreetmap.org', pathname: '/**' }],
  },
};

module.exports = nextConfig;
