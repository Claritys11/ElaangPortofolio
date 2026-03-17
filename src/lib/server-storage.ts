import { getStorageType } from '@/lib/storage-type';
import * as firebaseStorage from '@/lib/firebase-rest-storage';
import * as sqliteStorage from '@/lib/sqlite-storage';
import type {
  AchievementRecord,
  ProjectRecord,
  WriteupRecord,
} from '@/lib/portfolio-types';

function getServerStorage() {
  // Admin/auth routes always use SQLite regardless of STORAGE_TYPE.
  // Firebase mode only affects public client routes (handled by firebase-client-api.ts).
  void getStorageType(); // retain import reference
  return sqliteStorage;
}

export function listWriteups() {
  return getServerStorage().listWriteups();
}

export function getWriteupById(id: string) {
  return getServerStorage().getWriteupById(id);
}

export function createWriteup(data: Partial<WriteupRecord>) {
  return getServerStorage().createWriteup(data);
}

export function updateWriteup(id: string, data: Partial<WriteupRecord>) {
  return getServerStorage().updateWriteup(id, data);
}

export function deleteWriteup(id: string) {
  return getServerStorage().deleteWriteup(id);
}

export function listProjects() {
  return getServerStorage().listProjects();
}

export function createProject(data: Partial<ProjectRecord>) {
  return getServerStorage().createProject(data);
}

export function updateProject(id: string, data: Partial<ProjectRecord>) {
  return getServerStorage().updateProject(id, data);
}

export function deleteProject(id: string) {
  return getServerStorage().deleteProject(id);
}

export function listAchievements() {
  return getServerStorage().listAchievements();
}

export function createAchievement(data: Partial<AchievementRecord>) {
  return getServerStorage().createAchievement(data);
}

export function updateAchievement(id: string, data: Partial<AchievementRecord>) {
  return getServerStorage().updateAchievement(id, data);
}

export function deleteAchievement(id: string) {
  return getServerStorage().deleteAchievement(id);
}

export function listSecureMessages() {
  return getServerStorage().listSecureMessages();
}

export function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return getServerStorage().createContactMessage(input);
}

export function listAccessLogs(limit?: number) {
  return getServerStorage().listAccessLogs(limit);
}

export function createAccessLog(input: {
  username: string;
  accessedAt: string;
  accessSuccessful: boolean;
  ip: string;
}) {
  return getServerStorage().createAccessLog(input);
}

export function getHomeSummary() {
  return getServerStorage().getHomeSummary();
}