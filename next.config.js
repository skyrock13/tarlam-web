// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.tarlam.com.tr',
        port: '', // Usually empty for HTTPS
        pathname: '/storage/v1/object/public/**', // Correct, general wildcard
      },
    ],
  },
}

module.exports = nextConfig