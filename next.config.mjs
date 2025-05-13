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
  // Décommentez et ajustez ces lignes avec le nom exact de votre dépôt GitHub
  basePath: '/bonus-hunt',
  assetPrefix: '/bonus-hunt/',
};

export default nextConfig;
