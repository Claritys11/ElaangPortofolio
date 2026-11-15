import type { NextConfig } from "next";
import { BASE_PATH, OUTPUT_DIRECTORY, SITE_CONFIG } from "./src/lib/site-config";

const nextConfig: NextConfig = {
  output: "export",
  distDir: OUTPUT_DIRECTORY,
  ...(BASE_PATH ? { basePath: BASE_PATH } : {}),
  trailingSlash: SITE_CONFIG.trailingSlash ?? true,
  poweredByHeader: false,
  images: {
    // GitHub Pages serves the files generated at build time; no image optimizer API exists there.
    unoptimized: true,
  },
};

export default nextConfig;
