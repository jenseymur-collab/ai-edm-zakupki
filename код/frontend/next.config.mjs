/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* → backend:8000 чтобы избежать CORS в продакшене
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
