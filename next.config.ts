import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      // Allow up to 5MB files to be sent as base64 to Server Actions.
      // Base64 adds overhead, so the request body limit must be higher than 5MB.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
