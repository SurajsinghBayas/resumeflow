import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  serverExternalPackages: ["pg", "unpdf", "mammoth", "pdfjs-dist"],
};

export default nextConfig;
