/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export when building for production/Electron.
  // In dev mode, we need API routes to work (/api/answer, /api/transcribe).
  ...(process.env.NODE_ENV === "production" ? { output: "export" } : {}),
};

export default nextConfig;
