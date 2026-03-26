import type { NextConfig } from "next";

const configuredOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedDevOrigins =
  configuredOrigins && configuredOrigins.length > 0 ? configuredOrigins : [];

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
