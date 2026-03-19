import {
  getProfileSettings as getSqliteProfileSettings,
  updateProfileSettings as updateSqliteProfileSettings,
} from '@/lib/sqlite-storage';
import type { ProfileSettingsRecord } from '@/lib/portfolio-types';

export async function getProfileSettings(): Promise<ProfileSettingsRecord> {
  return getSqliteProfileSettings();
}

export async function updateProfileSettings(
  data: Partial<ProfileSettingsRecord>
): Promise<ProfileSettingsRecord> {
  return updateSqliteProfileSettings(data);
}