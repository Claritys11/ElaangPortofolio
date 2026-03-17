import { randomUUID } from 'crypto';
import { mkdir } from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import type {
  AccessLogRecord,
  AchievementRecord,
  HomeSummaryResponse,
  LatestActivityRecord,
  ProjectRecord,
  SecureMessageRecord,
  WriteupRecord,
} from '@/lib/portfolio-types';

type SqlParam = string | number | null;

interface RunResult {
  lastID: number;
  changes: number;
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

interface SummaryCountRow {
  count: number;
}

interface LatestRow {
  title: string | null;
  createdAt: string | null;
}

let dbPromise: Promise<sqlite3.Database> | null = null;

function getDbPath(): string {
  const configured = process.env.SQLITE_DB_PATH?.trim();
  const resolved = configured ? configured : path.join('data', 'portfolio.sqlite3');
  return path.isAbsolute(resolved) ? resolved : path.resolve(process.cwd(), resolved);
}

function run(db: sqlite3.Database, statement: string, params: SqlParam[] = []): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    db.run(statement, params, function onRun(error: Error | null) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

function all<T>(db: sqlite3.Database, statement: string, params: SqlParam[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(statement, params, (error, rows: T[]) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows);
    });
  });
}

function get<T>(db: sqlite3.Database, statement: string, params: SqlParam[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(statement, params, (error, row: T | undefined) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  });
}

async function migrate(db: sqlite3.Database): Promise<void> {
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

  await run(db, 'CREATE INDEX IF NOT EXISTS idx_writeups_created_at ON writeups(created_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS idx_achievements_created_at ON achievements(created_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS idx_secure_messages_created_at ON secure_messages(created_at DESC)');
  await run(db, 'CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs(accessed_at DESC)');
}

async function getDb(): Promise<sqlite3.Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
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

      await migrate(db);
      return db;
    })();
  }

  return dbPromise;
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
  const id = randomUUID();
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
  const id = randomUUID();
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
  const id = randomUUID();
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
  const id = randomUUID();
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
  const id = randomUUID();
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
