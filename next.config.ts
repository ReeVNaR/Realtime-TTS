import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    GEMINI_API_KEY: 'AIzaSyBWqxXGWNPAnEucNPk33KvPyc2r81TQ_2M',
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
