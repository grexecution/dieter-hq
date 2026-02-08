import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable PWA-friendly image optimization defaults if needed later.
  images: {
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },

  // Standalone output for self-hosted deployment (Coolify/Docker)
  output: "standalone",

  // Performance and build optimizations
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  
  // Skip ESLint during build (run separately in CI if needed)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip TypeScript errors during build (for faster iteration)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ensure native modules are not bundled into standalone (they need the real binary)
  serverExternalPackages: ["bcrypt"],

  // Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
