import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { getDefaultProfileSettings, mergeProfileSettings, normalizeProfileSettings } from '@/lib/about-default';
import type { ProfileSettingsRecord } from '@/lib/portfolio-types';

const PROFILE_FILE_PATH = path.join(process.cwd(), 'public', 'profile.json');

function withTimestamp(profile: ProfileSettingsRecord): ProfileSettingsRecord {
  return {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
}

function serializeProfileSettings(profile: ProfileSettingsRecord): string {
  return `${JSON.stringify(profile, null, 2)}\n`;
}

async function writeProfileFile(profile: ProfileSettingsRecord): Promise<void> {
  await mkdir(path.dirname(PROFILE_FILE_PATH), { recursive: true });
  await writeFile(PROFILE_FILE_PATH, serializeProfileSettings(profile), 'utf8');
}

async function ensureProfileFileExists(): Promise<void> {
  try {
    await readFile(PROFILE_FILE_PATH, 'utf8');
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== 'ENOENT') {
      throw error;
    }

    await writeProfileFile(withTimestamp(getDefaultProfileSettings()));
  }
}

export async function getProfileSettings(): Promise<ProfileSettingsRecord> {
  await ensureProfileFileExists();

  try {
    const raw = await readFile(PROFILE_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ProfileSettingsRecord>;
    return normalizeProfileSettings(parsed);
  } catch {
    const fallback = withTimestamp(getDefaultProfileSettings());
    await writeProfileFile(fallback);
    return fallback;
  }
}

export async function updateProfileSettings(
  data: Partial<ProfileSettingsRecord>
): Promise<ProfileSettingsRecord> {
  const current = await getProfileSettings();
  const next = withTimestamp(mergeProfileSettings(current, data));
  await writeProfileFile(next);
  return next;
}