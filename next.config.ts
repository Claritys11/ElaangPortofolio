import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Runtime fs access to public/uploads makes the tracer include the whole project; keep backups and dev-only trees out.
  outputFileTracingExcludes: {
    "*": ["*.dump", "*.tar.gz", "public/uploads/**", ".legacy/**", ".remember/**", ".superpowers/**", "docs/**", "tests/**", "e2e/**"],
  },
  async redirects() {
    return [{ source: "/ctf", destination: "/writeups", permanent: true }];
  },
};

export default nextConfig;
