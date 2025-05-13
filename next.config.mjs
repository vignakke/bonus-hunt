/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/bonus-hunt-tracker' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/bonus-hunt-tracker/' : '',
};

export default nextConfig;
