import {
  getProfileSettings as getProfileSettingsFromStorage,
  updateProfileSettings as updateProfileSettingsInStorage,
} from '@/lib/prisma-storage';
import type { ProfileSettingsRecord } from '@/lib/portfolio-types';

export async function getProfileSettings(): Promise<ProfileSettingsRecord> {
  return getProfileSettingsFromStorage();
}

export async function updateProfileSettings(
  data: Partial<ProfileSettingsRecord>
): Promise<ProfileSettingsRecord> {
  return updateProfileSettingsInStorage(data);
}
