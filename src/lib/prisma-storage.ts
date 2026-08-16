import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type { Prisma } from '@prisma/client';
import {
  DEFAULT_ABOUT_TEXT,
  DEFAULT_PHILOSOPHY_TEXT,
  getDefaultProfileSettings,
  mergeProfileSettings,
  normalizeProfileSettings,
} from '@/lib/about-default';
import { prisma } from '@/lib/prisma';
import { buildWriteupSlug } from '@/lib/seo-utils';
import type {
  AccessLogRecord,
  AchievementRecord,
  AttachmentRecord,
  HomeSummaryResponse,
  LatestActivityRecord,
  ProfileSettingsRecord,
  ProjectRecord,
  SecureMessageRecord,
  WriteupRecord,
} from '@/lib/portfolio-types';

const UPLOADS_DIRECTORY = path.resolve(process.cwd(), 'public', 'uploads');

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry).trim()))
    .filter(Boolean);
}

function asOptionalAttachments(value: unknown): AttachmentRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((entry): AttachmentRecord | null => {
      if (!entry || typeof entry !== 'object') return null;
      const attachment = entry as Record<string, unknown>;
      const url = asOptionalString(attachment.url)?.trim();
      if (!url) return null;
      const name = asOptionalString(attachment.name)?.trim();
      const contentType = asOptionalString(attachment.contentType)?.trim();
      return {
        name: name || url.split('/').pop() || 'Attachment',
        url,
        ...(contentType ? { contentType } : {}),
      };
    })
    .filter((attachment): attachment is AttachmentRecord => Boolean(attachment));
}

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIso(value: Date | null | undefined): string | undefined {
  return value?.toISOString();
}

function asJsonArray<T>(value: Prisma.JsonValue): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asJsonObject<T>(value: Prisma.JsonValue): T | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : undefined;
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function getImageExtension(contentType: string): string | null {
  switch (contentType.toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    default:
      return null;
  }
}

async function externalizeBase64ImagesFromHtml(html: string | undefined): Promise<string | undefined> {
  if (!html || !html.includes('data:image/')) return html;

  await mkdir(UPLOADS_DIRECTORY, { recursive: true });
  const dataUriPattern = /src=(["'])data:(image\/(?:png|jpe?g|gif|webp));base64,([^"']+)\1/gi;
  const replacements: Array<{ original: string; replacement: string }> = [];

  for (const match of html.matchAll(dataUriPattern)) {
    const [original, quote, contentType, rawBase64] = match;
    const extension = getImageExtension(contentType);
    if (!extension) continue;
    const buffer = Buffer.from(rawBase64.replace(/\s/g, ''), 'base64');
    if (!buffer.length) continue;
    const filename = `writeup-inline-${crypto.randomUUID()}.${extension}`;
    await writeFile(path.join(UPLOADS_DIRECTORY, filename), buffer);
    replacements.push({ original, replacement: `src=${quote}/api/public/uploads/${filename}${quote}` });
  }

  return replacements.reduce((nextHtml, replacement) => nextHtml.replace(replacement.original, replacement.replacement), html);
}

async function getUniqueWriteupSlug(data: Partial<WriteupRecord>, existingId?: string): Promise<string> {
  const requested = asOptionalString(data.slug)?.trim();
  const base = buildWriteupSlug({ title: requested || data.title, category: requested ? undefined : data.category });

  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const row = await prisma.writeup.findFirst({ where: { slug: candidate }, select: { id: true } });
    if (!row || row.id === existingId) return candidate;
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function mapWriteup(row: {
  id: string; slug: string | null; title: string | null; competition: string | null; category: string | null;
  difficulty: string | null; date: Date | null; summary: string | null; content: string | null; flag: string | null;
  tagsJson: Prisma.JsonValue; attachmentsJson: Prisma.JsonValue; createdAt: Date; updatedAt: Date;
}): WriteupRecord {
  return {
    id: row.id, slug: row.slug ?? undefined, title: row.title ?? undefined, competition: row.competition ?? undefined,
    category: row.category ?? undefined, difficulty: row.difficulty ?? undefined, date: toIso(row.date),
    summary: row.summary ?? undefined, content: row.content ?? undefined, flag: row.flag ?? undefined,
    tags: asJsonArray<string>(row.tagsJson), attachments: asJsonArray<AttachmentRecord>(row.attachmentsJson),
    createdAt: toIso(row.createdAt), updatedAt: toIso(row.updatedAt),
  };
}

function mapProject(row: {
  id: string; title: string | null; description: string | null; imageUrl: string | null; projectUrl: string | null;
  category: string | null; tagsJson: Prisma.JsonValue; createdAt: Date; updatedAt: Date;
}): ProjectRecord {
  return {
    id: row.id, title: row.title ?? undefined, description: row.description ?? undefined,
    imageUrl: row.imageUrl ?? undefined, projectUrl: row.projectUrl ?? undefined, category: row.category ?? undefined,
    tags: asJsonArray<string>(row.tagsJson), createdAt: toIso(row.createdAt), updatedAt: toIso(row.updatedAt),
  };
}

function mapAchievement(row: {
  id: string; title: string | null; issuer: string | null; platform: string | null; description: string | null;
  imageUrl: string | null; date: Date | null; createdAt: Date; updatedAt: Date;
}): AchievementRecord {
  return {
    id: row.id, title: row.title ?? undefined, issuer: row.issuer ?? undefined, platform: row.platform ?? undefined,
    description: row.description ?? undefined, imageUrl: row.imageUrl ?? undefined, date: toIso(row.date),
    createdAt: toIso(row.createdAt), updatedAt: toIso(row.updatedAt),
  };
}

function mapSecureMessage(row: { id: string; title: string | null; content: string | null; createdAt: Date; username: string | null }): SecureMessageRecord {
  return { id: row.id, title: row.title ?? undefined, content: row.content ?? undefined, createdAt: toIso(row.createdAt), username: row.username ?? undefined };
}

function mapAccessLog(row: { id: string; username: string | null; accessedAt: Date; accessSuccessful: boolean; ip: string | null }): AccessLogRecord {
  return { id: row.id, username: row.username ?? undefined, accessedAt: toIso(row.accessedAt), accessSuccessful: row.accessSuccessful, ip: row.ip ?? undefined };
}

function mapProfileSettings(row: {
  displayName: string | null; alias: string | null; navbarBrandMode: string; navbarBrandName: string | null; email: string | null;
  websiteUrl: string | null; githubUrl: string | null; instagramUrl: string | null; profileImageUrl: string | null;
  aboutText: string | null; philosophyText: string | null; technicalArsenalJson: Prisma.JsonValue;
  professionalJourneyJson: Prisma.JsonValue; educationHistoryJson: Prisma.JsonValue; seoSettingsJson: Prisma.JsonValue; updatedAt: Date;
}): ProfileSettingsRecord {
  const normalized = normalizeProfileSettings({
    displayName: row.displayName ?? undefined, alias: row.alias ?? undefined,
    navbarBrandMode: row.navbarBrandMode as 'default' | 'custom', navbarBrandName: row.navbarBrandName ?? undefined,
    email: row.email ?? undefined, websiteUrl: row.websiteUrl ?? undefined, githubUrl: row.githubUrl ?? undefined,
    instagramUrl: row.instagramUrl ?? undefined, profileImageUrl: row.profileImageUrl ?? undefined,
    aboutText: row.aboutText ?? undefined, philosophyText: row.philosophyText ?? undefined,
    technicalArsenal: asJsonArray(row.technicalArsenalJson), professionalJourney: asJsonArray(row.professionalJourneyJson),
    educationHistory: asJsonArray(row.educationHistoryJson), seo: asJsonObject(row.seoSettingsJson), updatedAt: toIso(row.updatedAt),
  });
  return { ...normalized, updatedAt: toIso(row.updatedAt) };
}

export async function listWriteups(): Promise<WriteupRecord[]> {
  return (await prisma.writeup.findMany({ orderBy: { createdAt: 'desc' } })).map(mapWriteup);
}

export async function listWriteupSummaries(): Promise<WriteupRecord[]> {
  const rows = await prisma.writeup.findMany({
    select: { id: true, slug: true, title: true, competition: true, category: true, difficulty: true, date: true, summary: true, tagsJson: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((row) => mapWriteup({ ...row, content: null, flag: null, attachmentsJson: [] }));
}

export async function getWriteupById(id: string): Promise<WriteupRecord | null> {
  const row = await prisma.writeup.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  return row ? mapWriteup(row) : null;
}

export async function createWriteup(data: Partial<WriteupRecord>): Promise<string> {
  const slug = await getUniqueWriteupSlug(data);
  const content = await externalizeBase64ImagesFromHtml(asOptionalString(data.content));
  const row = await prisma.writeup.create({ data: {
    slug, title: asOptionalString(data.title), competition: asOptionalString(data.competition), category: asOptionalString(data.category),
    difficulty: asOptionalString(data.difficulty), date: toDate(asOptionalString(data.date)), summary: asOptionalString(data.summary),
    content, flag: asOptionalString(data.flag), tagsJson: asOptionalStringArray(data.tags) ?? [],
    attachmentsJson: toInputJson(asOptionalAttachments(data.attachments) ?? []), ...(toDate(asOptionalString(data.createdAt)) ? { createdAt: toDate(asOptionalString(data.createdAt)) } : {}),
  } });
  return row.id;
}

export async function updateWriteup(id: string, data: Partial<WriteupRecord>): Promise<boolean> {
  const existing = await prisma.writeup.findUnique({ where: { id } });
  if (!existing) return false;
  const incomingContent = asOptionalString(data.content);
  const content = incomingContent ? await externalizeBase64ImagesFromHtml(incomingContent) : undefined;
  const slug = await getUniqueWriteupSlug({ ...data, title: asOptionalString(data.title) ?? existing.title ?? undefined, category: asOptionalString(data.category) ?? existing.category ?? undefined }, id);
  await prisma.writeup.update({ where: { id }, data: {
    slug, title: asOptionalString(data.title) ?? existing.title, competition: asOptionalString(data.competition) ?? existing.competition,
    category: asOptionalString(data.category) ?? existing.category, difficulty: asOptionalString(data.difficulty) ?? existing.difficulty,
    date: toDate(asOptionalString(data.date)) ?? existing.date, summary: asOptionalString(data.summary) ?? existing.summary,
    content: content ?? existing.content, flag: asOptionalString(data.flag) ?? existing.flag,
    tagsJson: asOptionalStringArray(data.tags) ?? asJsonArray<string>(existing.tagsJson),
    attachmentsJson: toInputJson(asOptionalAttachments(data.attachments) ?? asJsonArray<AttachmentRecord>(existing.attachmentsJson)),
  } });
  return true;
}

export async function deleteWriteup(id: string): Promise<boolean> {
  const result = await prisma.writeup.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  return (await prisma.project.findMany({ orderBy: { createdAt: 'desc' } })).map(mapProject);
}

export async function createProject(data: Partial<ProjectRecord>): Promise<string> {
  const row = await prisma.project.create({ data: {
    title: asOptionalString(data.title), description: asOptionalString(data.description), imageUrl: asOptionalString(data.imageUrl),
    projectUrl: asOptionalString(data.projectUrl), category: asOptionalString(data.category), tagsJson: asOptionalStringArray(data.tags) ?? [],
    ...(toDate(asOptionalString(data.createdAt)) ? { createdAt: toDate(asOptionalString(data.createdAt)) } : {}),
  } });
  return row.id;
}

export async function updateProject(id: string, data: Partial<ProjectRecord>): Promise<boolean> {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.project.update({ where: { id }, data: {
    title: asOptionalString(data.title) ?? existing.title, description: asOptionalString(data.description) ?? existing.description,
    imageUrl: asOptionalString(data.imageUrl) ?? existing.imageUrl, projectUrl: asOptionalString(data.projectUrl) ?? existing.projectUrl,
    category: asOptionalString(data.category) ?? existing.category, tagsJson: asOptionalStringArray(data.tags) ?? asJsonArray<string>(existing.tagsJson),
  } });
  return true;
}

export async function deleteProject(id: string): Promise<boolean> {
  const result = await prisma.project.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function listAchievements(): Promise<AchievementRecord[]> {
  return (await prisma.achievement.findMany({ orderBy: { createdAt: 'desc' } })).map(mapAchievement);
}

export async function createAchievement(data: Partial<AchievementRecord>): Promise<string> {
  const row = await prisma.achievement.create({ data: {
    title: asOptionalString(data.title), issuer: asOptionalString(data.issuer), platform: asOptionalString(data.platform),
    description: asOptionalString(data.description), imageUrl: asOptionalString(data.imageUrl), date: toDate(asOptionalString(data.date)),
    ...(toDate(asOptionalString(data.createdAt)) ? { createdAt: toDate(asOptionalString(data.createdAt)) } : {}),
  } });
  return row.id;
}

export async function updateAchievement(id: string, data: Partial<AchievementRecord>): Promise<boolean> {
  const existing = await prisma.achievement.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.achievement.update({ where: { id }, data: {
    title: asOptionalString(data.title) ?? existing.title, issuer: asOptionalString(data.issuer) ?? existing.issuer,
    platform: asOptionalString(data.platform) ?? existing.platform, description: asOptionalString(data.description) ?? existing.description,
    imageUrl: asOptionalString(data.imageUrl) ?? existing.imageUrl, date: toDate(asOptionalString(data.date)) ?? existing.date,
  } });
  return true;
}

export async function deleteAchievement(id: string): Promise<boolean> {
  const result = await prisma.achievement.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function listSecureMessages(): Promise<SecureMessageRecord[]> {
  return (await prisma.secureMessage.findMany({ orderBy: { createdAt: 'desc' } })).map(mapSecureMessage);
}

export async function deleteSecureMessage(id: string): Promise<boolean> {
  const result = await prisma.secureMessage.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function createContactMessage(input: { name: string; email: string; subject: string; message: string }): Promise<string> {
  const row = await prisma.secureMessage.create({ data: {
    title: input.subject, content: `From: ${input.name} (${input.email})\n\n${input.message}`, username: input.name, source: 'contact-form',
  } });
  return row.id;
}

export async function listAccessLogs(limit = 200): Promise<AccessLogRecord[]> {
  const boundedLimit = Math.max(1, Math.min(500, limit));
  return (await prisma.accessLog.findMany({ orderBy: { accessedAt: 'desc' }, take: boundedLimit })).map(mapAccessLog);
}

export async function createAccessLog(input: { username: string; accessedAt: Date; accessSuccessful: boolean; ip: string }): Promise<string> {
  const row = await prisma.accessLog.create({ data: input });
  return row.id;
}

export async function getProfileSettings(): Promise<ProfileSettingsRecord> {
  const row = await prisma.profileSettings.findUnique({ where: { id: 'main' } });
  return row ? mapProfileSettings(row) : getDefaultProfileSettings();
}

export async function updateProfileSettings(data: Partial<ProfileSettingsRecord>): Promise<ProfileSettingsRecord> {
  const existing = await prisma.profileSettings.findUnique({ where: { id: 'main' } });
  const nextProfile = mergeProfileSettings(existing ? mapProfileSettings(existing) : getDefaultProfileSettings(), data);
  const stored = await prisma.profileSettings.upsert({
    where: { id: 'main' },
    create: {
      id: 'main', displayName: nextProfile.displayName, alias: nextProfile.alias, navbarBrandMode: nextProfile.navbarBrandMode ?? 'default',
      navbarBrandName: nextProfile.navbarBrandName, email: nextProfile.email, websiteUrl: nextProfile.websiteUrl, githubUrl: nextProfile.githubUrl,
      instagramUrl: nextProfile.instagramUrl, profileImageUrl: nextProfile.profileImageUrl, aboutText: nextProfile.aboutText ?? DEFAULT_ABOUT_TEXT,
      philosophyText: nextProfile.philosophyText ?? DEFAULT_PHILOSOPHY_TEXT, technicalArsenalJson: toInputJson(nextProfile.technicalArsenal ?? []),
      professionalJourneyJson: toInputJson(nextProfile.professionalJourney ?? []), educationHistoryJson: toInputJson(nextProfile.educationHistory ?? []), seoSettingsJson: toInputJson(nextProfile.seo ?? {}),
    },
    update: {
      displayName: nextProfile.displayName, alias: nextProfile.alias, navbarBrandMode: nextProfile.navbarBrandMode ?? 'default',
      navbarBrandName: nextProfile.navbarBrandName, email: nextProfile.email, websiteUrl: nextProfile.websiteUrl, githubUrl: nextProfile.githubUrl,
      instagramUrl: nextProfile.instagramUrl, profileImageUrl: nextProfile.profileImageUrl, aboutText: nextProfile.aboutText ?? DEFAULT_ABOUT_TEXT,
      philosophyText: nextProfile.philosophyText ?? DEFAULT_PHILOSOPHY_TEXT, technicalArsenalJson: toInputJson(nextProfile.technicalArsenal ?? []),
      professionalJourneyJson: toInputJson(nextProfile.professionalJourney ?? []), educationHistoryJson: toInputJson(nextProfile.educationHistory ?? []), seoSettingsJson: toInputJson(nextProfile.seo ?? {}),
    },
  });
  return mapProfileSettings(stored);
}

export async function getHomeSummary(): Promise<HomeSummaryResponse> {
  const [writeupCount, projectCount, achievementCount, writeup, project, achievement] = await Promise.all([
    prisma.writeup.count(), prisma.project.count(), prisma.achievement.count(),
    prisma.writeup.findFirst({ orderBy: { createdAt: 'desc' }, select: { title: true, createdAt: true } }),
    prisma.project.findFirst({ orderBy: { createdAt: 'desc' }, select: { title: true, createdAt: true } }),
    prisma.achievement.findFirst({ orderBy: { createdAt: 'desc' }, select: { title: true, createdAt: true } }),
  ]);
  const latestCandidates: LatestActivityRecord[] = [
    ...(writeup?.title ? [{ type: 'WRITE-UP' as const, title: writeup.title, date: writeup.createdAt.toISOString() }] : []),
    ...(project?.title ? [{ type: 'PROJECT' as const, title: project.title, date: project.createdAt.toISOString() }] : []),
    ...(achievement?.title ? [{ type: 'ACHIEVEMENT' as const, title: achievement.title, date: achievement.createdAt.toISOString() }] : []),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  return { writeupCount, projectCount, achievementCount, latestActivity: latestCandidates[0] ?? null };
}
