/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  // We remove output: "export" to allow dynamic routes (Clerk) and API routes (Webhooks) on Vercel.
  
  // Increase API route body size limit
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Allow external images (like Clerk profile photos)
  images: {
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
      }
    ],
  },
};

export default nextConfig;
