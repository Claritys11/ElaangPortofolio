import type { WriteupRecord } from '@/lib/portfolio-types';

const FALLBACK_SITE_BASE_URL = 'https://clarityz.my.id';

function normalizeBaseUrl(value: string | undefined): string {
  if (!value?.trim()) {
    return FALLBACK_SITE_BASE_URL;
  }

  try {
    const url = new URL(value);
    return url.toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_SITE_BASE_URL;
  }
}

export const SITE_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL);
export const BRAND_NAME = 'Elang Dimas Syadewa';
export const BRAND_ALIAS = 'Claritys';
export const SITE_NAME = `${BRAND_NAME} Portfolio`;

export function stripHtml(value: string | undefined): string {
  return (value ?? '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(value: string | undefined, maxLength: number): string {
  const normalized = stripHtml(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const trimmed = normalized.slice(0, maxLength - 1);
  const lastSpace = trimmed.lastIndexOf(' ');
  return `${trimmed.slice(0, lastSpace > 80 ? lastSpace : trimmed.length).trim()}...`;
}

export function slugify(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 96);
}

export function buildWriteupSlug(input: Pick<WriteupRecord, 'title' | 'category'>): string {
  const category = slugify(input.category);
  const title = slugify(input.title);
  const base = [category, title].filter(Boolean).join('-');
  return base || 'ctf-writeup';
}

export function getWriteupPath(writeup: Pick<WriteupRecord, 'id' | 'slug'>): string {
  return `/ctf/${writeup.slug || writeup.id}`;
}

export function getWriteupUrl(writeup: Pick<WriteupRecord, 'id' | 'slug'>): string {
  return `${SITE_BASE_URL}${getWriteupPath(writeup)}`;
}

export function getWriteupMetaTitle(writeup: Pick<WriteupRecord, 'title' | 'category'>): string {
  const title = writeup.title?.trim() || 'CTF Writeup';
  const category = writeup.category?.trim() || 'CTF';
  return `${title} | ${category} CTF Writeup by ${BRAND_NAME}`;
}

export function getWriteupMetaDescription(
  writeup: Pick<WriteupRecord, 'title' | 'category' | 'summary'>
): string {
  const title = writeup.title?.trim() || 'this challenge';
  const category = writeup.category?.trim() || 'CTF';
  const summary = truncateText(writeup.summary, 110);
  const prefix = `Read ${title}, a ${category} CTF writeup by ${BRAND_NAME}.`;
  return truncateText([prefix, summary].filter(Boolean).join(' '), 155);
}
