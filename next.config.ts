import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isProd = process.env.NODE_ENV === "production";

// Deliberately no script-src/style-src lockdown: Next.js relies on inline
// scripts/styles. For a strict nonce CSP see the proxy.ts pattern in the
// Next docs (content-security-policy guide). These headers still buy
// clickjacking, MIME-sniffing, and capability protection.
const csp = [
  "default-src 'self'",
  // React dev needs eval() for error-stack reconstruction; production never uses it.
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  serverExternalPackages: ["pg", "unpdf", "mammoth", "pdfjs-dist"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
