import * as d1Storage from '@/lib/d1-storage';
import type {
  AchievementRecord,
  ProfileSettingsRecord,
  ProjectRecord,
  WriteupRecord,
} from '@/lib/portfolio-types';

function getServerStorage() {
  return d1Storage;
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

export function deleteSecureMessage(id: string) {
  return getServerStorage().deleteSecureMessage(id);
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

export function getProfileSettings() {
  return getServerStorage().getProfileSettings();
}

export function updateProfileSettings(data: Partial<ProfileSettingsRecord>) {
  return getServerStorage().updateProfileSettings(data);
}