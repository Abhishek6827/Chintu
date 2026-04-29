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
};

export default nextConfig;
