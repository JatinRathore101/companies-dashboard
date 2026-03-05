import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling better-sqlite3; let Node.js load it natively.
  // This is required because better-sqlite3 is a native CommonJS addon that
  // cannot be processed by the webpack/turbopack bundler.
  serverExternalPackages: ["better-sqlite3"],

  // Silences warnings about detecting multiple lockfiles
  outputFileTracingRoot: path.join(__dirname, "./"),
};

export default nextConfig;
