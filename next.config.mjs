/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  // Only use static export when building for production/Electron.
  // In dev mode, we need API routes to work (/api/answer, /api/transcribe).
  ...(isProd ? { output: "export" } : {}),
  
  // Ignore API routes (route.ts) during production build since they cannot be statically exported.
  // Electron handles these via its embedded Express server in production.
  pageExtensions: isProd ? ['tsx', 'jsx'] : ['ts', 'tsx', 'js', 'jsx'],
  
  // Increase API route body size limit (default 1MB is too small for screenshots)
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
