/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  // We remove output: "export" to allow dynamic routes (Clerk) and API routes (Webhooks) on Vercel.
  
  // Performance: enable gzip compression
  compress: true,
  // Security + Performance: remove X-Powered-By header
  poweredByHeader: false,
  // Modern performance optimizations
  reactStrictMode: true,
  swcMinify: true,

  // Increase API route body size limit
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    optimizePackageImports: ['lucide-react', 'framer-motion', '@tabler/icons-react'],
  },
  // Allow external images (like Clerk profile photos)
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
      },
      {
        protocol: 'https',
        hostname: 'cdn.simpleicons.org',
      },
      {
        protocol: 'https',
        hostname: 'cdn.brandfetch.io',
      },
      {
        protocol: 'https',
        hostname: 'www.getchintu.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'www.micro1.ai',
      },
      {
        protocol: 'https',
        hostname: 'vtlogo.com',
      },
      {
        protocol: 'https',
        hostname: 'www.pramp.com',
      },
      {
        protocol: 'https',
        hostname: 'unpkg.com',
      },
      {
        protocol: 'https',
        hostname: 'karat.com',
      }
    ],
  },
};

export default nextConfig;
