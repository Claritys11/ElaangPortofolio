import { readFile } from "node:fs/promises";
import path from "node:path";

// Archivo (the site's display face) for generated preview cards. The built-in card font has no heavy
// weight. Files live in src/assets/fonts and are traced into the standalone build (next.config.ts).
const dir = path.join(/* turbopackIgnore: true */ process.cwd(), "src/assets/fonts");

export async function ogFonts() {
  const [regular, black] = await Promise.all([readFile(path.join(dir, "archivo-latin-400-normal.woff")), readFile(path.join(dir, "archivo-latin-900-normal.woff"))]);
  return [
    { name: "Archivo", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Archivo", data: black, weight: 900 as const, style: "normal" as const },
  ];
}
