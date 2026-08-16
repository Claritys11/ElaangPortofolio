import path from 'path';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { marked } from 'marked';
import { PDFParse } from 'pdf-parse';
import { getSessionFromRequest } from '@/lib/session';
import { uploadFileToUploadsFolder } from '@/lib/upload-storage';

export const runtime = 'nodejs';

const MAX_IMPORT_SIZE = 30 * 1024 * 1024;
const MAX_NESTED_ZIP_DEPTH = 2;

interface ImportedDocument {
  title: string;
  summary: string;
  content: string;
  pageCount?: number;
  assetCount?: number;
  sourceType: 'pdf' | 'notion';
}

interface ZipAsset {
  name: string;
  buffer: Buffer;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizePdfText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function getTitleFromText(text: string, fallback: string): string {
  const firstUsefulLine = text
    .split('\n')
    .map((line) => line.trim().replace(/^#+\s*/, ''))
    .find((line) => line.length >= 4 && line.length <= 120);

  return firstUsefulLine || fallback.replace(/\.[^.]+$/i, '').replace(/[-_]+/g, ' ').trim() || 'Imported Writeup';
}

function getSummaryFromText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 260);
}

function textToHtml(text: string): string {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const joined = lines.join(' ');
      const looksLikeHeading = lines.length === 1 && joined.length <= 90 && !/[.!?]$/.test(joined);

      if (looksLikeHeading) {
        return `<h2>${escapeHtml(joined)}</h2>`;
      }

      return `<p>${escapeHtml(joined)}</p>`;
    })
    .join('\n');
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'asset.bin';
}

function getMimeType(fileName: string): string {
  switch (path.extname(fileName).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

function isImagePath(filePath: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(filePath);
}

function normalizeAssetKey(value: string): string {
  const withoutQuery = value.split(/[?#]/)[0] || value;
  const decoded = safeDecodeURIComponent(withoutQuery.replace(/\+/g, '%20'));
  return decoded.replace(/^\.?\//, '').trim().toLowerCase();
}

function safeDecodeURIComponent(value: string): string {
  try {
    return globalThis.decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveAssetUrl(src: string, assetUrls: Map<string, string>): string | null {
  if (!src || /^(?:https?:|mailto:|#|data:)/i.test(src)) {
    return null;
  }

  const normalized = normalizeAssetKey(src);
  const baseName = normalizeAssetKey(path.basename(normalized));

  return assetUrls.get(normalized) || assetUrls.get(baseName) || null;
}

async function uploadBufferAsset(fileName: string, buffer: Buffer): Promise<string> {
  const storedName = `${randomUUID()}-${sanitizeFileName(path.basename(fileName))}`;
  const contentType = getMimeType(fileName);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: contentType });
  const uploaded = await uploadFileToUploadsFolder(storedName, blob.stream(), contentType, buffer.length);

  if (!uploaded.ok) {
    throw new Error(uploaded.error);
  }

  return uploaded.publicUrl;
}

async function collectZipFiles(buffer: Buffer, depth = 0, prefix = ''): Promise<Map<string, ZipAsset>> {
  const zip = await JSZip.loadAsync(buffer);
  const files = new Map<string, ZipAsset>();

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;

    const entryBuffer = Buffer.from(await entry.async('uint8array'));
    const entryName = `${prefix}${entry.name}`;

    if (/\.zip$/i.test(entry.name) && depth < MAX_NESTED_ZIP_DEPTH) {
      const nestedFiles = await collectZipFiles(entryBuffer, depth + 1, `${path.dirname(entryName)}/`);
      nestedFiles.forEach((asset, key) => files.set(key, asset));
      continue;
    }

    files.set(normalizeAssetKey(entryName), { name: entryName, buffer: entryBuffer });
    files.set(normalizeAssetKey(path.basename(entryName)), { name: entryName, buffer: entryBuffer });
  }

  return files;
}

function chooseContentFile(files: Map<string, ZipAsset>): ZipAsset | null {
  const candidates = [...files.values()]
    .filter((asset, index, list) => list.findIndex((item) => item.name === asset.name) === index)
    .filter((asset) => /\.(md|markdown|html?)$/i.test(asset.name))
    .sort((a, b) => b.buffer.length - a.buffer.length);

  return candidates[0] || null;
}

async function uploadZipImages(files: Map<string, ZipAsset>): Promise<{ urls: Map<string, string>; count: number }> {
  const assetUrls = new Map<string, string>();
  const uniqueAssets = [...files.values()]
    .filter((asset, index, list) => list.findIndex((item) => item.name === asset.name) === index)
    .filter((asset) => isImagePath(asset.name));

  for (const asset of uniqueAssets) {
    const publicUrl = await uploadBufferAsset(asset.name, asset.buffer);
    assetUrls.set(normalizeAssetKey(asset.name), publicUrl);
    assetUrls.set(normalizeAssetKey(path.basename(asset.name)), publicUrl);
  }

  return { urls: assetUrls, count: uniqueAssets.length };
}

function cleanNotionMarkdown(markdown: string): string {
  return markdown
    .replace(/^\s*\[[^\]]*]\(data:image\/[^)]+\)\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function replaceMarkdownImageLinks(markdown: string, assetUrls: Map<string, string>): string {
  return markdown.replace(/!\[([^\]]*)]\(([^)]+)\)/g, (match, alt: string, src: string) => {
    const cleanSrc = src.trim().replace(/^<|>$/g, '');
    const uploadedUrl = resolveAssetUrl(cleanSrc, assetUrls);
    return uploadedUrl ? `![${alt}](${uploadedUrl})` : match;
  });
}

function extractHtmlTitle(html: string, fallback: string): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const text = stripHtml(title || h1 || '');
  return text || fallback.replace(/\.[^.]+$/i, '').trim() || 'Imported Writeup';
}

function extractHtmlBody(html: string): string {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;

  return body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s(?:class|style|id)="[^"]*"/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function replaceHtmlImageLinks(html: string, assetUrls: Map<string, string>): string {
  return html.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (match, before: string, src: string, after: string) => {
    const uploadedUrl = resolveAssetUrl(src, assetUrls);
    return uploadedUrl ? `${before}${uploadedUrl}${after}` : match;
  });
}

async function importPdf(file: File, buffer: Buffer): Promise<ImportedDocument> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = normalizePdfText(result.text || '');

  if (!text) {
    throw new Error('No readable text was found in this PDF.');
  }

  return {
    title: getTitleFromText(text, file.name),
    summary: getSummaryFromText(text),
    content: textToHtml(text),
    pageCount: result.total,
    sourceType: 'pdf',
  };
}

async function importNotionZip(file: File, buffer: Buffer): Promise<ImportedDocument> {
  const files = await collectZipFiles(buffer);
  const contentFile = chooseContentFile(files);

  if (!contentFile) {
    throw new Error('No Markdown or HTML file was found in this Notion export.');
  }

  const uploadedAssets = await uploadZipImages(files);
  const assetUrls = uploadedAssets.urls;
  const rawContent = contentFile.buffer.toString('utf8');
  const isMarkdown = /\.(md|markdown)$/i.test(contentFile.name);

  if (isMarkdown) {
    const markdown = replaceMarkdownImageLinks(cleanNotionMarkdown(rawContent), assetUrls);
    const html = String(await marked.parse(markdown, { gfm: true, breaks: false }));
    const plainText = markdown
      .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
      .replace(/`{1,3}/g, '')
      .replace(/[#>*_\-[\]()]/g, ' ');

    return {
      title: getTitleFromText(markdown, file.name),
      summary: getSummaryFromText(plainText),
      content: html,
      assetCount: uploadedAssets.count,
      sourceType: 'notion',
    };
  }

  const body = replaceHtmlImageLinks(extractHtmlBody(rawContent), assetUrls);
  const plainText = stripHtml(body);

  return {
    title: extractHtmlTitle(rawContent, file.name),
    summary: getSummaryFromText(plainText),
    content: body,
    assetCount: uploadedAssets.count,
    sourceType: 'notion',
  };
}

export async function POST(req: NextRequest) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'PDF or Notion ZIP file is required.' }, { status: 400 });
  }

  if (file.size > MAX_IMPORT_SIZE) {
    return NextResponse.json({ error: 'Import file is too large. Maximum size is 30 MB.' }, { status: 413 });
  }

  const fileName = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
  const isZip =
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    fileName.endsWith('.zip');

  if (!isPdf && !isZip) {
    return NextResponse.json({ error: 'Only PDF files or Notion ZIP exports can be imported.' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const imported = isZip ? await importNotionZip(file, buffer) : await importPdf(file, buffer);
    return NextResponse.json(imported);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import this file.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
