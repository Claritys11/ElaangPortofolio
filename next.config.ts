import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    // The proxy buffers request bodies (default 10MB) and silently truncates beyond; uploads allow 30MB.
    proxyClientMaxBodySize: "32mb",
    // Default 1MB rejects writeups with large HTML or legacy data: images; schemas allow more.
    serverActions: { bodySizeLimit: "10mb" },
  },
  // pdf-parse loads its worker at runtime; keep it out of the bundle.
  serverExternalPackages: ["pdf-parse"],
  // Runtime fs access to public/uploads makes the tracer include the whole project; keep backups and dev-only trees out.
  outputFileTracingExcludes: {
    "*": ["*.dump", "*.tar.gz", "public/uploads/**", ".legacy/**", ".remember/**", ".superpowers/**", "docs/**", "tests/**", "e2e/**"],
  },
  // pdfjs (via pdf-parse) imports its worker dynamically; the tracer can't see it.
  outputFileTracingIncludes: {
    "/api/admin/writeups/import-pdf": ["./node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
  async redirects() {
    return [{ source: "/ctf", destination: "/writeups", permanent: true }];
  },
};

export default nextConfig;
