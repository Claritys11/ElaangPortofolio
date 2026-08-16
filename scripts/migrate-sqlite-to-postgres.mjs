import path from 'node:path';
import sqlite3 from 'sqlite3';
import { PrismaClient } from '@prisma/client';

const sourcePath = process.env.SQLITE_BACKUP_PATH;

if (!sourcePath) {
  throw new Error('SQLITE_BACKUP_PATH must point to the copied SQLite backup.');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set for the target PostgreSQL database.');
}

const prisma = new PrismaClient();

function openSqlite(filePath) {
  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(path.resolve(filePath), sqlite3.OPEN_READONLY, (error) => {
      if (error) reject(error);
      else resolve(database);
    });
  });
}

function readAll(database, table) {
  return new Promise((resolve, reject) => {
    database.all(`SELECT * FROM ${table}`, (error, rows) => {
      if (error) reject(error);
      else resolve(rows ?? []);
    });
  });
}

function closeSqlite(database) {
  return new Promise((resolve, reject) => database.close((error) => (error ? reject(error) : resolve())));
}

function migrationError(table, id, column, message) {
  return new Error(`${table}[${id ?? 'unknown'}].${column}: ${message}`);
}

function requiredString(table, row, column) {
  const value = row[column];
  if (typeof value !== 'string' || !value) {
    throw migrationError(table, row.id, column, 'expected a non-empty string');
  }
  return value;
}

function optionalString(value) {
  return typeof value === 'string' ? value : null;
}

function toDate(table, row, column, { required = false } = {}) {
  const value = row[column];
  if (value === null || value === undefined || value === '') {
    if (required) throw migrationError(table, row.id, column, 'timestamp is required');
    return null;
  }

  if (typeof value !== 'string') {
    throw migrationError(table, row.id, column, 'expected an ISO timestamp string');
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw migrationError(table, row.id, column, `invalid timestamp ${JSON.stringify(value)}`);
  }
  return parsed;
}

function toJson(table, row, column, fallback, expected) {
  const value = row[column];
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') {
    throw migrationError(table, row.id, column, 'expected JSON text');
  }

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw migrationError(table, row.id, column, 'invalid JSON');
  }

  if (expected === 'array' && !Array.isArray(parsed)) {
    throw migrationError(table, row.id, column, 'expected a JSON array');
  }
  if (expected === 'object' && (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) {
    throw migrationError(table, row.id, column, 'expected a JSON object');
  }
  return parsed;
}

function prepareWriteups(rows) {
  return rows.map((row) => ({
    id: requiredString('writeups', row, 'id'),
    slug: optionalString(row.slug),
    title: optionalString(row.title),
    competition: optionalString(row.competition),
    category: optionalString(row.category),
    difficulty: optionalString(row.difficulty),
    date: toDate('writeups', row, 'date'),
    summary: optionalString(row.summary),
    content: optionalString(row.content),
    flag: optionalString(row.flag),
    tagsJson: toJson('writeups', row, 'tags_json', [], 'array'),
    attachmentsJson: toJson('writeups', row, 'attachments_json', [], 'array'),
    createdAt: toDate('writeups', row, 'created_at', { required: true }),
    updatedAt: toDate('writeups', row, 'updated_at', { required: true }),
  }));
}

function prepareProjects(rows) {
  return rows.map((row) => ({
    id: requiredString('projects', row, 'id'),
    title: optionalString(row.title),
    description: optionalString(row.description),
    imageUrl: optionalString(row.image_url),
    projectUrl: optionalString(row.project_url),
    category: optionalString(row.category),
    tagsJson: toJson('projects', row, 'tags_json', [], 'array'),
    createdAt: toDate('projects', row, 'created_at', { required: true }),
    updatedAt: toDate('projects', row, 'updated_at', { required: true }),
  }));
}

function prepareAchievements(rows) {
  return rows.map((row) => ({
    id: requiredString('achievements', row, 'id'),
    title: optionalString(row.title),
    issuer: optionalString(row.issuer),
    platform: optionalString(row.platform),
    description: optionalString(row.description),
    imageUrl: optionalString(row.image_url),
    date: toDate('achievements', row, 'date'),
    createdAt: toDate('achievements', row, 'created_at', { required: true }),
    updatedAt: toDate('achievements', row, 'updated_at', { required: true }),
  }));
}

function prepareSecureMessages(rows) {
  return rows.map((row) => ({
    id: requiredString('secure_messages', row, 'id'),
    title: optionalString(row.title),
    content: optionalString(row.content),
    username: optionalString(row.username),
    source: optionalString(row.source),
    createdAt: toDate('secure_messages', row, 'created_at', { required: true }),
    updatedAt: toDate('secure_messages', row, 'updated_at', { required: true }),
  }));
}

function prepareAccessLogs(rows) {
  return rows.map((row) => ({
    id: requiredString('access_logs', row, 'id'),
    username: optionalString(row.username),
    accessedAt: toDate('access_logs', row, 'accessed_at', { required: true }),
    accessSuccessful: Boolean(row.access_successful),
    ip: optionalString(row.ip),
    createdAt: toDate('access_logs', row, 'created_at', { required: true }),
  }));
}

function prepareProfileSettings(rows) {
  return rows.map((row) => ({
    id: requiredString('profile_settings', row, 'id'),
    displayName: optionalString(row.display_name),
    alias: optionalString(row.alias),
    navbarBrandMode: optionalString(row.navbar_brand_mode) ?? 'default',
    navbarBrandName: optionalString(row.navbar_brand_name),
    email: optionalString(row.email),
    websiteUrl: optionalString(row.website_url),
    githubUrl: optionalString(row.github_url),
    instagramUrl: optionalString(row.instagram_url),
    profileImageUrl: optionalString(row.profile_image_url),
    aboutText: optionalString(row.about_text),
    philosophyText: optionalString(row.philosophy_text),
    technicalArsenalJson: toJson('profile_settings', row, 'technical_arsenal_json', [], 'array'),
    professionalJourneyJson: toJson('profile_settings', row, 'professional_journey_json', [], 'array'),
    educationHistoryJson: toJson('profile_settings', row, 'education_history_json', [], 'array'),
    seoSettingsJson: toJson('profile_settings', row, 'seo_settings_json', {}, 'object'),
    updatedAt: toDate('profile_settings', row, 'updated_at', { required: true }),
  }));
}

async function upsertAll(delegate, rows) {
  for (const row of rows) {
    const { id, ...data } = row;
    await delegate.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

async function main() {
  const sqlite = await openSqlite(sourcePath);
  try {
    const sourceRows = {
      writeups: await readAll(sqlite, 'writeups'),
      projects: await readAll(sqlite, 'projects'),
      achievements: await readAll(sqlite, 'achievements'),
      secure_messages: await readAll(sqlite, 'secure_messages'),
      access_logs: await readAll(sqlite, 'access_logs'),
      profile_settings: await readAll(sqlite, 'profile_settings'),
    };

    const prepared = {
      writeups: prepareWriteups(sourceRows.writeups),
      projects: prepareProjects(sourceRows.projects),
      achievements: prepareAchievements(sourceRows.achievements),
      secure_messages: prepareSecureMessages(sourceRows.secure_messages),
      access_logs: prepareAccessLogs(sourceRows.access_logs),
      profile_settings: prepareProfileSettings(sourceRows.profile_settings),
    };

    await upsertAll(prisma.writeup, prepared.writeups);
    await upsertAll(prisma.project, prepared.projects);
    await upsertAll(prisma.achievement, prepared.achievements);
    await upsertAll(prisma.secureMessage, prepared.secure_messages);
    await upsertAll(prisma.accessLog, prepared.access_logs);
    await upsertAll(prisma.profileSettings, prepared.profile_settings);

    const targetCounts = {
      writeups: await prisma.writeup.count(),
      projects: await prisma.project.count(),
      achievements: await prisma.achievement.count(),
      secure_messages: await prisma.secureMessage.count(),
      access_logs: await prisma.accessLog.count(),
      profile_settings: await prisma.profileSettings.count(),
    };

    let valid = true;
    for (const table of Object.keys(sourceRows)) {
      const sourceCount = sourceRows[table].length;
      const targetCount = targetCounts[table];
      const matches = sourceCount === targetCount;
      valid &&= matches;
      console.log(`${table}: SQLite=${sourceCount} PostgreSQL=${targetCount} ${matches ? 'OK' : 'MISMATCH'}`);
    }

    if (!valid) {
      throw new Error('Row counts do not match. PostgreSQL migration verification failed.');
    }
  } finally {
    await closeSqlite(sqlite);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
