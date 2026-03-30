import { mkdir } from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import {
  DEFAULT_ABOUT_TEXT,
  DEFAULT_PHILOSOPHY_TEXT,
  getDefaultProfileSettings,
  mergeProfileSettings,
  normalizeProfileSettings,
} from '@/lib/about-default';
import type {
  AccessLogRecord,
  AchievementRecord,
  HomeSummaryResponse,
  LatestActivityRecord,
  ProfileSettingsRecord,
  ProjectRecord,
  SecureMessageRecord,
  WriteupRecord,
} from '@/lib/portfolio-types';

type SqlParam = string | number | null;

interface RunResult {
  lastID: number;
  changes: number;
}

interface D1Meta {
  changes?: number;
  last_row_id?: number;
}

interface D1RunResult {
  meta?: D1Meta;
}

interface D1AllResult<T> {
  results?: T[];
}

interface D1PreparedStatement {
  bind(...values: SqlParam[]): D1PreparedStatement;
  run(): Promise<D1RunResult>;
  all<T>(): Promise<D1AllResult<T>>;
  first<T>(): Promise<T | null>;
}

interface D1DatabaseBinding {
  prepare(statement: string): D1PreparedStatement;
}

interface WriteupRow {
  id: string;
  title: string | null;
  competition: string | null;
  category: string | null;
  difficulty: string | null;
  date: string | null;
  summary: string | null;
  content: string | null;
  flag: string | null;
  tags_json: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectRow {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
  category: string | null;
  tags_json: string | null;
  created_at: string;
  updated_at: string;
}

interface AchievementRow {
  id: string;
  title: string | null;
  issuer: string | null;
  platform: string | null;
  description: string | null;
  image_url: string | null;
  date: string | null;
  created_at: string;
  updated_at: string;
}

interface SecureMessageRow {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  username: string | null;
  source: string | null;
}

interface AccessLogRow {
  id: string;
  username: string | null;
  accessed_at: string;
  access_successful: number;
  ip: string | null;
  created_at: string;
}

interface ProfileSettingsRow {
  id: string;
  display_name: string | null;
  email: string | null;
  website_url: string | null;
  github_url: string | null;
  instagram_url: string | null;
  profile_image_url: string | null;
  about_text: string | null;
  philosophy_text: string | null;
  technical_arsenal_json: string | null;
  professional_journey_json: string | null;
  education_history_json: string | null;
  seo_settings_json: string | null;
  updated_at: string;
}

interface TableColumnInfoRow {
  name: string;
}

interface SummaryCountRow {
  count: number;
}

interface LatestRow {
  title: string | null;
  createdAt: string | null;
}

let migrationPromise: Promise<void> | null = null;
let dbPromise: Promise<D1DatabaseBinding> | null = null;

function getDbPath(): string {
  const configured = process.env.SQLITE_DB_PATH?.trim();
  const resolved = configured ? configured : path.join('data', 'portfolio.sqlite3');
  return path.isAbsolute(resolved) ? resolved : path.resolve(process.cwd(), resolved);
}

class SqlitePreparedStatement implements D1PreparedStatement {
  private values: SqlParam[] = [];

  constructor(
    private readonly db: sqlite3.Database,
    private readonly statement: string
  ) {}

  bind(...values: SqlParam[]): D1PreparedStatement {
    this.values = values;
    return this;
  }

  run(): Promise<D1RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(this.statement, this.values, function onRun(error: Error | null) {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          meta: {
            changes: this.changes,
            last_row_id: this.lastID,
          },
        });
      });
    });
  }

  all<T>(): Promise<D1AllResult<T>> {
    return new Promise((resolve, reject) => {
      this.db.all(this.statement, this.values, (error, rows: T[]) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          results: rows ?? [],
        });
      });
    });
  }

  first<T>(): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.db.get(this.statement, this.values, (error, row: T | undefined) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(row ?? null);
      });
    });
  }
}

class SqliteDatabaseBinding implements D1DatabaseBinding {
  constructor(private readonly db: sqlite3.Database) {}

  prepare(statement: string): D1PreparedStatement {
    return new SqlitePreparedStatement(this.db, statement);
  }
}

async function openSqliteDatabaseBinding(): Promise<D1DatabaseBinding> {
  const dbPath = getDbPath();
  await mkdir(path.dirname(dbPath), { recursive: true });

  const db = await new Promise<sqlite3.Database>((resolve, reject) => {
    const connection = new sqlite3.Database(dbPath, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(connection);
    });
  });

  return new SqliteDatabaseBinding(db);
}

async function run(db: D1DatabaseBinding, statement: string, params: SqlParam[] = []): Promise<RunResult> {
  const prepared = db.prepare(statement).bind(...params);
  const result = await prepared.run();
  return {
    lastID: Number(result.meta?.last_row_id ?? 0),
    changes: Number(result.meta?.changes ?? 0),
  };
}

async function all<T>(db: D1DatabaseBinding, statement: string, params: SqlParam[] = []): Promise<T[]> {
  const prepared = db.prepare(statement).bind(...params);
  const result = await prepared.all<T>();
  return result.results ?? [];
}

async function get<T>(db: D1DatabaseBinding, statement: string, params: SqlParam[] = []): Promise<T | undefined> {
  const prepared = db.prepare(statement).bind(...params);
  const row = await prepared.first<T>();
  return row ?? undefined;
}

async function ensureTableColumn(
  db: D1DatabaseBinding,
  tableName: string,
  columnName: string,
  columnDefinition: string
): Promise<void> {
  const columns = await all<TableColumnInfoRow>(db, `PRAGMA table_info(${tableName})`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await run(db, `ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  }
}

async function ensureProfileSettingsColumns(db: D1DatabaseBinding): Promise<void> {
  await ensureTableColumn(db, 'profile_settings', 'display_name', 'display_name TEXT');
  await ensureTableColumn(db, 'profile_settings', 'email', 'email TEXT');
  await ensureTableColumn(db, 'profile_settings', 'website_url', 'website_url TEXT');
  await ensureTableColumn(db, 'profile_settings', 'github_url', 'github_url TEXT');
  await ensureTableColumn(db, 'profile_settings', 'instagram_url', 'instagram_url TEXT');
  await ensureTableColumn(db, 'profile_settings', 'profile_image_url', 'profile_image_url TEXT');
  await ensureTableColumn(db, 'profile_settings', 'philosophy_text', 'philosophy_text TEXT');
  await ensureTableColumn(db, 'profile_settings', 'technical_arsenal_json', "technical_arsenal_json TEXT NOT NULL DEFAULT '[]'");
  await ensureTableColumn(db, 'profile_settings', 'professional_journey_json', "professional_journey_json TEXT NOT NULL DEFAULT '[]'");
  await ensureTableColumn(db, 'profile_settings', 'education_history_json', "education_history_json TEXT NOT NULL DEFAULT '[]'");
  await ensureTableColumn(db, 'profile_settings', 'seo_settings_json', "seo_settings_json TEXT NOT NULL DEFAULT '{}'");
}

async function migrate(db: D1DatabaseBinding): Promise<void> {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS writeups (
      id TEXT PRIMARY KEY,
      title TEXT,
      competition TEXT,
      category TEXT,
      difficulty TEXT,
      date TEXT,
      summary TEXT,
      content TEXT,
      flag TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      image_url TEXT,
      project_url TEXT,
      category TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      title TEXT,
      issuer TEXT,
      platform TEXT,
      description TEXT,
      image_url TEXT,
      date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS secure_messages (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      username TEXT,
      source TEXT
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS access_logs (
      id TEXT PRIMARY KEY,
      username TEXT,
      accessed_at TEXT NOT NULL,
      access_successful INTEGER NOT NULL,
      ip TEXT,
      created_at TEXT NOT NULL
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS profile_settings (
      id TEXT PRIMARY KEY,
      display_name TEXT,
      email TEXT,
      website_url TEXT,
      github_url TEXT,
      instagram_url TEXT,
      profile_image_url TEXT,
      about_text TEXT,
      philosophy_text TEXT,
      technical_arsenal_json TEXT NOT NULL DEFAULT '[]',
      professional_journey_json TEXT NOT NULL DEFAULT '[]',
      education_history_json TEXT NOT NULL DEFAULT '[]',
      seo_settings_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL
    )`
  );

  await ensureProfileSettingsColumns(db);

  const defaultProfileSettings = getDefaultProfileSettings();

  await run(
    db,
    `INSERT OR IGNORE INTO profile_settings (
      id,
      display_name,
      email,
      website_url,
      github_url,
      instagram_url,
      profile_image_url,
      about_text,
      philosophy_text,
      technical_arsenal_json,
      professional_journey_json,
      education_history_json,
      seo_settings_json,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'main',
      defaultProfileSettings.displayName ?? 'My Name',
      defaultProfileSettings.email ?? 'email@domain.tld',
      defaultProfileSettings.websiteUrl ?? 'https://domain.tld',
      defaultProfileSettings.githubUrl ?? 'http://github.com/github',
      defaultProfileSettings.instagramUrl ?? 'https://www.instagram.com',
      defaultProfileSettings.profileImageUrl ?? '/profile.jpg',
      defaultProfileSettings.aboutText ?? DEFAULT_ABOUT_TEXT,
      defaultProfileSettings.philosophyText ?? DEFAULT_PHILOSOPHY_TEXT,
      JSON.stringify(defaultProfileSettings.technicalArsenal ?? []),
      JSON.stringify(defaultProfileSettings.professionalJourney ?? []),
      JSON.stringify(defaultProfileSettings.educationHistory ?? []),
      JSON.stringify(defaultProfileSettings.seo ?? {}),
      new Date().toISOString(),
    ]
  );

  await run(db, 'CREATE INDEX IF NOT EXISTS idx_writeups_created_at ON writeups(created_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS idx_achievements_created_at ON achievements(created_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS idx_secure_messages_created_at ON secure_messages(created_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs(accessed_at DESC)');
}

async function getDb(): Promise<D1DatabaseBinding> {
  if (!dbPromise) {
    dbPromise = openSqliteDatabaseBinding();
  }

  const db = await dbPromise;

  if (!migrationPromise) {
    migrationPromise = migrate(db).catch((error) => {
      migrationPromise = null;
      throw error;
    });
  }

  await migrationPromise;
  return db;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry).trim()))
    .filter(Boolean);
}

function parseTags(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry).trim()))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function parseJsonArray<T>(raw: string | null): T[] | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as T[]) : undefined;
  } catch {
    return undefined;
  }
}

function parseJsonObject<T>(raw: string | null): T | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return value as T;
  } catch {
    return undefined;
  }
}

function mapWriteupRow(row: WriteupRow): WriteupRecord {
  return {
    id: row.id,
    title: row.title ?? undefined,
    competition: row.competition ?? undefined,
    category: row.category ?? undefined,
    difficulty: row.difficulty ?? undefined,
    date: row.date ?? undefined,
    summary: row.summary ?? undefined,
    content: row.content ?? undefined,
    flag: row.flag ?? undefined,
    tags: parseTags(row.tags_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectRow(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    projectUrl: row.project_url ?? undefined,
    category: row.category ?? undefined,
    tags: parseTags(row.tags_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAchievementRow(row: AchievementRow): AchievementRecord {
  return {
    id: row.id,
    title: row.title ?? undefined,
    issuer: row.issuer ?? undefined,
    platform: row.platform ?? undefined,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    date: row.date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSecureMessageRow(row: SecureMessageRow): SecureMessageRecord {
  return {
    id: row.id,
    title: row.title ?? undefined,
    content: row.content ?? undefined,
    createdAt: row.created_at,
    username: row.username ?? undefined,
  };
}

function mapAccessLogRow(row: AccessLogRow): AccessLogRecord {
  return {
    id: row.id,
    username: row.username ?? undefined,
    accessedAt: row.accessed_at,
    accessSuccessful: Boolean(row.access_successful),
    ip: row.ip ?? undefined,
  };
}

function mapProfileSettingsRow(row: ProfileSettingsRow): ProfileSettingsRecord {
  const normalized = normalizeProfileSettings({
    displayName: row.display_name ?? undefined,
    email: row.email ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    githubUrl: row.github_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    profileImageUrl: row.profile_image_url ?? undefined,
    aboutText: row.about_text ?? undefined,
    philosophyText: row.philosophy_text ?? undefined,
    technicalArsenal: parseJsonArray(row.technical_arsenal_json),
    professionalJourney: parseJsonArray(row.professional_journey_json),
    educationHistory: parseJsonArray(row.education_history_json),
    seo: parseJsonObject<NonNullable<ProfileSettingsRecord['seo']>>(row.seo_settings_json),
    updatedAt: row.updated_at,
  });

  return {
    ...normalized,
    updatedAt: row.updated_at,
  };
}

export async function listWriteups(): Promise<WriteupRecord[]> {
  const db = await getDb();
  const rows = await all<WriteupRow>(db, 'SELECT * FROM writeups ORDER BY created_at DESC');
  return rows.map(mapWriteupRow);
}

export async function getWriteupById(id: string): Promise<WriteupRecord | null> {
  const db = await getDb();
  const row = await get<WriteupRow>(db, 'SELECT * FROM writeups WHERE id = ? LIMIT 1', [id]);
  return row ? mapWriteupRow(row) : null;
}

export async function createWriteup(data: Partial<WriteupRecord>): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await run(
    db,
    `INSERT INTO writeups (
      id, title, competition, category, difficulty, date, summary, content, flag, tags_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      asOptionalString(data.title) ?? null,
      asOptionalString(data.competition) ?? null,
      asOptionalString(data.category) ?? null,
      asOptionalString(data.difficulty) ?? null,
      asOptionalString(data.date) ?? null,
      asOptionalString(data.summary) ?? null,
      asOptionalString(data.content) ?? null,
      asOptionalString(data.flag) ?? null,
      JSON.stringify(asOptionalStringArray(data.tags) ?? []),
      asOptionalString(data.createdAt) ?? now,
      now,
    ]
  );

  return id;
}

export async function updateWriteup(id: string, data: Partial<WriteupRecord>): Promise<boolean> {
  const db = await getDb();
  const existing = await get<WriteupRow>(db, 'SELECT * FROM writeups WHERE id = ? LIMIT 1', [id]);
  if (!existing) {
    return false;
  }

  const now = new Date().toISOString();
  const incomingTags = asOptionalStringArray(data.tags);

  const result = await run(
    db,
    `UPDATE writeups SET
      title = ?,
      competition = ?,
      category = ?,
      difficulty = ?,
      date = ?,
      summary = ?,
      content = ?,
      flag = ?,
      tags_json = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      asOptionalString(data.title) ?? existing.title,
      asOptionalString(data.competition) ?? existing.competition,
      asOptionalString(data.category) ?? existing.category,
      asOptionalString(data.difficulty) ?? existing.difficulty,
      asOptionalString(data.date) ?? existing.date,
      asOptionalString(data.summary) ?? existing.summary,
      asOptionalString(data.content) ?? existing.content,
      asOptionalString(data.flag) ?? existing.flag,
      incomingTags ? JSON.stringify(incomingTags) : existing.tags_json,
      now,
      id,
    ]
  );

  return result.changes > 0;
}

export async function deleteWriteup(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await run(db, 'DELETE FROM writeups WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const db = await getDb();
  const rows = await all<ProjectRow>(db, 'SELECT * FROM projects ORDER BY created_at DESC');
  return rows.map(mapProjectRow);
}

export async function createProject(data: Partial<ProjectRecord>): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await run(
    db,
    `INSERT INTO projects (
      id, title, description, image_url, project_url, category, tags_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      asOptionalString(data.title) ?? null,
      asOptionalString(data.description) ?? null,
      asOptionalString(data.imageUrl) ?? null,
      asOptionalString(data.projectUrl) ?? null,
      asOptionalString(data.category) ?? null,
      JSON.stringify(asOptionalStringArray(data.tags) ?? []),
      asOptionalString(data.createdAt) ?? now,
      now,
    ]
  );

  return id;
}

export async function updateProject(id: string, data: Partial<ProjectRecord>): Promise<boolean> {
  const db = await getDb();
  const existing = await get<ProjectRow>(db, 'SELECT * FROM projects WHERE id = ? LIMIT 1', [id]);
  if (!existing) {
    return false;
  }

  const now = new Date().toISOString();
  const incomingTags = asOptionalStringArray(data.tags);

  const result = await run(
    db,
    `UPDATE projects SET
      title = ?,
      description = ?,
      image_url = ?,
      project_url = ?,
      category = ?,
      tags_json = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      asOptionalString(data.title) ?? existing.title,
      asOptionalString(data.description) ?? existing.description,
      asOptionalString(data.imageUrl) ?? existing.image_url,
      asOptionalString(data.projectUrl) ?? existing.project_url,
      asOptionalString(data.category) ?? existing.category,
      incomingTags ? JSON.stringify(incomingTags) : existing.tags_json,
      now,
      id,
    ]
  );

  return result.changes > 0;
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await run(db, 'DELETE FROM projects WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listAchievements(): Promise<AchievementRecord[]> {
  const db = await getDb();
  const rows = await all<AchievementRow>(db, 'SELECT * FROM achievements ORDER BY created_at DESC');
  return rows.map(mapAchievementRow);
}

export async function createAchievement(data: Partial<AchievementRecord>): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await run(
    db,
    `INSERT INTO achievements (
      id, title, issuer, platform, description, image_url, date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      asOptionalString(data.title) ?? null,
      asOptionalString(data.issuer) ?? null,
      asOptionalString(data.platform) ?? null,
      asOptionalString(data.description) ?? null,
      asOptionalString(data.imageUrl) ?? null,
      asOptionalString(data.date) ?? null,
      asOptionalString(data.createdAt) ?? now,
      now,
    ]
  );

  return id;
}

export async function updateAchievement(id: string, data: Partial<AchievementRecord>): Promise<boolean> {
  const db = await getDb();
  const existing = await get<AchievementRow>(db, 'SELECT * FROM achievements WHERE id = ? LIMIT 1', [id]);
  if (!existing) {
    return false;
  }

  const now = new Date().toISOString();

  const result = await run(
    db,
    `UPDATE achievements SET
      title = ?,
      issuer = ?,
      platform = ?,
      description = ?,
      image_url = ?,
      date = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      asOptionalString(data.title) ?? existing.title,
      asOptionalString(data.issuer) ?? existing.issuer,
      asOptionalString(data.platform) ?? existing.platform,
      asOptionalString(data.description) ?? existing.description,
      asOptionalString(data.imageUrl) ?? existing.image_url,
      asOptionalString(data.date) ?? existing.date,
      now,
      id,
    ]
  );

  return result.changes > 0;
}

export async function deleteAchievement(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await run(db, 'DELETE FROM achievements WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listSecureMessages(): Promise<SecureMessageRecord[]> {
  const db = await getDb();
  const rows = await all<SecureMessageRow>(db, 'SELECT * FROM secure_messages ORDER BY created_at DESC');
  return rows.map(mapSecureMessageRow);
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await run(
    db,
    `INSERT INTO secure_messages (
      id, title, content, created_at, updated_at, username, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.subject,
      `From: ${input.name} (${input.email})\n\n${input.message}`,
      now,
      now,
      input.name,
      'contact-form',
    ]
  );

  return id;
}

export async function listAccessLogs(limit = 200): Promise<AccessLogRecord[]> {
  const db = await getDb();
  const boundedLimit = Math.max(1, Math.min(500, limit));

  const rows = await all<AccessLogRow>(
    db,
    `SELECT * FROM access_logs ORDER BY accessed_at DESC LIMIT ${boundedLimit}`
  );

  return rows.map(mapAccessLogRow);
}

export async function createAccessLog(input: {
  username: string;
  accessedAt: string;
  accessSuccessful: boolean;
  ip: string;
}): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await run(
    db,
    `INSERT INTO access_logs (
      id, username, accessed_at, access_successful, ip, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.username, input.accessedAt, input.accessSuccessful ? 1 : 0, input.ip, now]
  );

  return id;
}

export async function getProfileSettings(): Promise<ProfileSettingsRecord> {
  const db = await getDb();
  const row = await get<ProfileSettingsRow>(db, 'SELECT * FROM profile_settings WHERE id = ? LIMIT 1', ['main']);

  if (!row) {
    return getDefaultProfileSettings();
  }

  return mapProfileSettingsRow(row);
}

export async function updateProfileSettings(
  data: Partial<ProfileSettingsRecord>
): Promise<ProfileSettingsRecord> {
  const db = await getDb();
  const existing = await get<ProfileSettingsRow>(db, 'SELECT * FROM profile_settings WHERE id = ? LIMIT 1', ['main']);

  const now = new Date().toISOString();
  const existingProfile = existing ? mapProfileSettingsRow(existing) : getDefaultProfileSettings();
  const nextProfile = mergeProfileSettings(existingProfile, data);

  await run(
    db,
    `INSERT INTO profile_settings (
      id,
      display_name,
      email,
      website_url,
      github_url,
      instagram_url,
      profile_image_url,
      about_text,
      philosophy_text,
      technical_arsenal_json,
      professional_journey_json,
      education_history_json,
      seo_settings_json,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       display_name = excluded.display_name,
       email = excluded.email,
       website_url = excluded.website_url,
       github_url = excluded.github_url,
       instagram_url = excluded.instagram_url,
       profile_image_url = excluded.profile_image_url,
       about_text = excluded.about_text,
       philosophy_text = excluded.philosophy_text,
       technical_arsenal_json = excluded.technical_arsenal_json,
       professional_journey_json = excluded.professional_journey_json,
       education_history_json = excluded.education_history_json,
       seo_settings_json = excluded.seo_settings_json,
       updated_at = excluded.updated_at`,
    [
      'main',
      nextProfile.displayName ?? null,
      nextProfile.email ?? null,
      nextProfile.websiteUrl ?? null,
      nextProfile.githubUrl ?? null,
      nextProfile.instagramUrl ?? null,
      nextProfile.profileImageUrl ?? null,
      nextProfile.aboutText ?? DEFAULT_ABOUT_TEXT,
      nextProfile.philosophyText ?? DEFAULT_PHILOSOPHY_TEXT,
      JSON.stringify(nextProfile.technicalArsenal ?? []),
      JSON.stringify(nextProfile.professionalJourney ?? []),
      JSON.stringify(nextProfile.educationHistory ?? []),
      JSON.stringify(nextProfile.seo ?? {}),
      now,
    ]
  );

  return {
    ...nextProfile,
    updatedAt: now,
  };
}

function pushLatestCandidate(
  latestCandidates: LatestActivityRecord[],
  type: LatestActivityRecord['type'],
  row: LatestRow | undefined
): void {
  if (!row?.title || !row.createdAt) {
    return;
  }

  latestCandidates.push({
    type,
    title: row.title,
    date: row.createdAt,
  });
}

export async function getHomeSummary(): Promise<HomeSummaryResponse> {
  const db = await getDb();

  const [writeupCountRow, projectCountRow, achievementCountRow, latestWriteup, latestProject, latestAchievement] = await Promise.all([
    get<SummaryCountRow>(db, 'SELECT COUNT(*) AS count FROM writeups'),
    get<SummaryCountRow>(db, 'SELECT COUNT(*) AS count FROM projects'),
    get<SummaryCountRow>(db, 'SELECT COUNT(*) AS count FROM achievements'),
    get<LatestRow>(db, 'SELECT title, created_at AS createdAt FROM writeups ORDER BY created_at DESC LIMIT 1'),
    get<LatestRow>(db, 'SELECT title, created_at AS createdAt FROM projects ORDER BY created_at DESC LIMIT 1'),
    get<LatestRow>(db, 'SELECT title, created_at AS createdAt FROM achievements ORDER BY created_at DESC LIMIT 1'),
  ]);

  const latestCandidates: LatestActivityRecord[] = [];
  pushLatestCandidate(latestCandidates, 'WRITE-UP', latestWriteup);
  pushLatestCandidate(latestCandidates, 'PROJECT', latestProject);
  pushLatestCandidate(latestCandidates, 'ACHIEVEMENT', latestAchievement);

  latestCandidates.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  return {
    writeupCount: Number(writeupCountRow?.count ?? 0),
    projectCount: Number(projectCountRow?.count ?? 0),
    achievementCount: Number(achievementCountRow?.count ?? 0),
    latestActivity: latestCandidates[0] ?? null,
  };
}
