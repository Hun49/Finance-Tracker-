import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["localhost", "192.168.1.4"],
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;