import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": fileURLToPath(new URL("./tests/unit/stubs/empty.ts", import.meta.url)) },
  },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
