import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSiteConfig } from "./site-config.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = readSiteConfig(ROOT_DIR);
const ROOT = path.join(ROOT_DIR, SITE.outputDirectory);
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 3100);
const BASE_PATH = SITE.basePath;
const TYPES = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".zip": "application/zip",
};

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("Port must be an integer between 1 and 65535.");
}

async function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return null;

  const candidate = path.resolve(ROOT, "." + decoded);
  if (candidate !== ROOT && !candidate.startsWith(ROOT + path.sep)) return null;

  if (!path.extname(candidate)) {
    try {
      const html = candidate + ".html";
      if ((await stat(html)).isFile()) return html;
    } catch {
      // Continue with directory-index lookup for trailing-slash exports.
    }
  }

  try {
    const info = await stat(candidate);
    if (info.isDirectory()) {
      const index = path.join(candidate, "index.html");
      return (await stat(index)).isFile() ? index : null;
    }
    return info.isFile() ? candidate : null;
  } catch {
    if (path.extname(candidate)) return null;
    try {
      const index = path.join(candidate, "index.html");
      return (await stat(index)).isFile() ? index : null;
    } catch {
      return null;
    }
  }
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  } catch {
    response.writeHead(400).end();
    return;
  }

  const exportPath = BASE_PATH && (pathname === BASE_PATH || pathname.startsWith(BASE_PATH + "/"))
    ? pathname.slice(BASE_PATH.length) || "/"
    : pathname;
  let file = await resolveFile(exportPath);
  let status = 200;
  if (!file) {
    file = path.join(ROOT, "404.html");
    status = 404;
    try {
      if (!(await stat(file)).isFile()) throw new Error("404 page missing");
    } catch {
      response.writeHead(404).end("Not found");
      return;
    }
  }

  const contentType = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const headers = {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": path.extname(file) === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  };
  if (request.method === "HEAD") {
    response.writeHead(status, headers).end();
    return;
  }

  response.writeHead(status, headers);
  createReadStream(file).on("error", () => response.destroy()).pipe(response);
});

server.listen(PORT, "127.0.0.1", () => {
  process.stdout.write(`Static portfolio preview: http://127.0.0.1:${PORT}\n`);
});
