import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/ctf", destination: "/writeups", permanent: true }];
  },
};

export default nextConfig;
