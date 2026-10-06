import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR ?? path.join(process.cwd(), "public", "uploads"));
export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

export class UploadError extends Error {
  constructor(
    message: string,
    public status: 413 | 415,
  ) {
    super(message);
  }
}

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
};

export function mimeFor(name: string): string {
  return MIME[path.extname(name).toLowerCase()] ?? "application/octet-stream";
}

export function isValidAssetName(name: string): boolean {
  if (typeof name !== "string" || name.length === 0 || name.length > 255) return false;
  if (name === "." || name === "..") return false;
  if (/[/\\]/.test(name) || /[\u0000-\u001f\u007f]/.test(name)) return false;
  return path.dirname(path.join(UPLOADS_DIR, name)) === UPLOADS_DIR;
}

export function toStoredName(original: string): string {
  const base =
    path
      .basename(original)
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-{2,}/g, "-")
      .slice(-120) || "file.bin";
  return `${randomUUID()}-${base}`;
}

export const publicUploadUrl = (name: string) => `/api/public/uploads/${encodeURIComponent(name)}`;

export async function readUpload(name: string) {
  if (!isValidAssetName(name)) return { error: 400 as const };
  const file = path.join(UPLOADS_DIR, name);
  try {
    const s = await stat(file);
    if (!s.isFile()) return { error: 404 as const };
    const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
    return { stream, size: s.size, contentType: mimeFor(name) };
  } catch {
    return { error: 404 as const };
  }
}

// SVG is excluded: an uploaded SVG served same-origin could carry script.
const ALLOWED = /^(image\/(png|jpe?g|gif|webp|avif)|application\/(pdf|zip|octet-stream|x-zip-compressed|vnd\.tcpdump\.pcap)|text\/plain|video\/mp4|audio\/mpeg)$/;

export async function writeUpload(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("File too large (max 30MB).", 413);
  const type = (file.type || "application/octet-stream").split(";")[0];
  if (!ALLOWED.test(type)) throw new UploadError(`Type ${type} not allowed.`, 415);
  const name = toStoredName(file.name);
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { name, url: publicUploadUrl(name), contentType: type };
}

export async function deleteUpload(name: string): Promise<200 | 400 | 404> {
  if (!isValidAssetName(name)) return 400;
  try {
    await unlink(path.join(UPLOADS_DIR, name));
    return 200;
  } catch {
    return 404;
  }
}

export async function listUploads() {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const names = await readdir(UPLOADS_DIR);
  const items = await Promise.all(
    names.filter(isValidAssetName).map(async (name) => {
      const s = await stat(path.join(UPLOADS_DIR, name));
      return { name, size: s.size, modified: s.mtime.toISOString(), url: publicUploadUrl(name) };
    }),
  );
  return items.sort((a, b) => b.modified.localeCompare(a.modified));
}
