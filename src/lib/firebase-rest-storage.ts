import { createSign, randomUUID } from 'crypto';
import type {
  AccessLogRecord,
  AchievementRecord,
  HomeSummaryResponse,
  LatestActivityRecord,
  ProjectRecord,
  SecureMessageRecord,
  WriteupRecord,
} from '@/lib/portfolio-types';

type FirestoreScalar = string | boolean | number | null;
type FirestoreEncodable = FirestoreScalar | string[];

interface FirestoreFieldValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  nullValue?: null;
  arrayValue?: {
    values?: FirestoreFieldValue[];
  };
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreFieldValue>;
}

interface IdentityToolkitSuccess {
  idToken?: string;
  expiresIn?: string;
}

interface GoogleOAuthSuccess {
  access_token?: string;
  expires_in?: number;
}

interface IdentityToolkitErrorResponse {
  error?: {
    message?: string;
  };
}

interface FirestoreListResponse {
  documents?: FirestoreDocument[];
}

interface CachedFirebaseToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedFirebaseToken | null = null;

interface CachedFirebaseAuthFailure {
  error: Error;
  retryAt: number;
}

let cachedAuthFailure: CachedFirebaseAuthFailure | null = null;

interface ServiceAccountCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set when STORAGE_TYPE is firebase.`);
  }
  return value;
}

function getProjectId(): string {
  return process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() || getRequiredEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
}

function getApiKey(): string {
  return getRequiredEnv('NEXT_PUBLIC_FIREBASE_API_KEY');
}

function getAdminEmail(): string {
  return getRequiredEnv('NEXT_PUBLIC_FIREBASE_ADMIN_EMAIL');
}

function getAdminPassword(): string {
  return getRequiredEnv('ADMIN_PASSWORD');
}

function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId: getProjectId(),
    clientEmail,
    privateKey,
  };
}

function getDocumentsBaseUrl(): string {
  return `https://firestore.googleapis.com/v1/projects/${getProjectId()}/databases/(default)/documents`;
}

function buildAdminAuthExplanation(): string {
  return (
    'NEXT_PUBLIC_FIREBASE_* only identify the Firebase project for client SDK initialization; ' +
    'they are not privileged server credentials. For server-side admin Firestore access, configure ' +
    'FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY, or fall back to a real Firebase Authentication ' +
    'user that matches NEXT_PUBLIC_FIREBASE_ADMIN_EMAIL and ADMIN_PASSWORD.'
  );
}

function decodeFirestoreValue(value: FirestoreFieldValue | undefined): unknown {
  if (!value) {
    return undefined;
  }

  if (typeof value.stringValue === 'string') {
    return value.stringValue;
  }

  if (typeof value.booleanValue === 'boolean') {
    return value.booleanValue;
  }

  if (typeof value.integerValue === 'string') {
    return Number(value.integerValue);
  }

  if (typeof value.doubleValue === 'number') {
    return value.doubleValue;
  }

  if ('nullValue' in value) {
    return null;
  }

  if (value.arrayValue) {
    return (value.arrayValue.values ?? []).map((entry) => decodeFirestoreValue(entry)).filter((entry): entry is string => typeof entry === 'string');
  }

  return undefined;
}

function encodeFirestoreValue(value: FirestoreEncodable): FirestoreFieldValue {
  if (value === null) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((entry) => ({ stringValue: entry })),
      },
    };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }
    return { doubleValue: value };
  }

  return { stringValue: value };
}

function encodeFields(data: Record<string, unknown>): Record<string, FirestoreFieldValue> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, encodeFirestoreValue(value as FirestoreEncodable)])
  );
}

function getDocumentId(name: string): string {
  const parts = name.split('/');
  return parts[parts.length - 1] ?? name;
}

function decodeDocument<T>(document: FirestoreDocument): T {
  const decoded = Object.fromEntries(
    Object.entries(document.fields ?? {}).map(([key, value]) => [key, decodeFirestoreValue(value)])
  );

  return {
    id: getDocumentId(document.name),
    ...decoded,
  } as T;
}

function mapIdentityToolkitError(message?: string): Error {
  switch (message) {
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_LOGIN_CREDENTIALS':
    case 'INVALID_PASSWORD':
    case 'USER_DISABLED':
      return new Error(
        `Firebase email/password fallback sign-in failed. ${buildAdminAuthExplanation()}`
      );
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return new Error(
        'Firebase email/password fallback has been rate limited by Identity Toolkit. Wait before retrying, or configure FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY for true server-side access.'
      );
    default:
      return new Error(message ? `Firebase email/password fallback failed: ${message}` : 'Firebase email/password fallback failed.');
  }
}

function mapServiceAccountError(message?: string): Error {
  return new Error(
    message
      ? `Service account Firestore authentication failed: ${message}`
      : 'Service account Firestore authentication failed. Check FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.'
  );
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function createServiceAccountAssertion(credentials: ServiceAccountCredentials): string {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: credentials.clientEmail,
      sub: credentials.clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/datastore',
      iat: nowInSeconds,
      exp: nowInSeconds + 3600,
    })
  );
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(credentials.privateKey).toString('base64url');

  return `${unsignedToken}.${signature}`;
}

async function signInWithServiceAccount(credentials: ServiceAccountCredentials): Promise<CachedFirebaseToken> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createServiceAccountAssertion(credentials),
    }),
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as ({ error?: string; error_description?: string } & GoogleOAuthSuccess) | null;

  if (!response.ok) {
    throw mapServiceAccountError(payload?.error_description ?? payload?.error);
  }

  const accessToken = payload?.access_token;
  const expiresInSeconds = Number(payload?.expires_in ?? 3600);

  if (!accessToken) {
    throw new Error('Service account authentication succeeded without an access token.');
  }

  return {
    token: accessToken,
    expiresAt: Date.now() + Math.max(60, expiresInSeconds - 60) * 1000,
  };
}

async function signInFirebaseAdmin(): Promise<CachedFirebaseToken> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(getApiKey())}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnSecureToken: true,
        email: getAdminEmail(),
        password: getAdminPassword(),
      }),
      cache: 'no-store',
    }
  );

  const payload = (await response.json().catch(() => null)) as IdentityToolkitSuccess | IdentityToolkitErrorResponse | null;

  if (!response.ok) {
    const error = mapIdentityToolkitError((payload as IdentityToolkitErrorResponse | null)?.error?.message);
    cachedAuthFailure = {
      error,
      retryAt:
        (payload as IdentityToolkitErrorResponse | null)?.error?.message === 'TOO_MANY_ATTEMPTS_TRY_LATER'
          ? Date.now() + 60_000
          : Date.now() + 15_000,
    };
    throw error;
  }

  const idToken = (payload as IdentityToolkitSuccess | null)?.idToken;
  const expiresInSeconds = Number((payload as IdentityToolkitSuccess | null)?.expiresIn ?? '3600');

  if (!idToken) {
    throw new Error('Firebase admin backend sign-in succeeded without an ID token.');
  }

  cachedAuthFailure = null;
  return {
    token: idToken,
    expiresAt: Date.now() + Math.max(60, expiresInSeconds - 60) * 1000,
  };
}

async function getFirebaseAdminIdToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (cachedAuthFailure && cachedAuthFailure.retryAt > Date.now()) {
    throw cachedAuthFailure.error;
  }

  cachedAuthFailure = null;

  const serviceAccountCredentials = getServiceAccountCredentials();
  cachedToken = serviceAccountCredentials
    ? await signInWithServiceAccount(serviceAccountCredentials)
    : await signInFirebaseAdmin();
  return cachedToken.token;
}

async function firestoreRequest<T>(url: string, init?: RequestInit, allowNotFound = false): Promise<T | null> {
  const idToken = await getFirebaseAdminIdToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (allowNotFound && response.status === 404) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | T | null;

  if (!response.ok) {
    throw new Error(payload && typeof payload === 'object' && 'error' in payload ? String(payload.error?.message ?? 'Firestore request failed.') : 'Firestore request failed.');
  }

  return payload as T;
}

async function listCollection<T>(collectionPath: string, options?: { orderBy?: string; pageSize?: number }): Promise<T[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('pageSize', String(options?.pageSize ?? 1000));
  if (options?.orderBy) {
    searchParams.set('orderBy', options.orderBy);
  }

  const response = await firestoreRequest<FirestoreListResponse>(`${getDocumentsBaseUrl()}/${collectionPath}?${searchParams.toString()}`);
  return (response?.documents ?? []).map((document) => decodeDocument<T>(document));
}

async function getDocument<T>(documentPath: string): Promise<T | null> {
  const document = await firestoreRequest<FirestoreDocument>(`${getDocumentsBaseUrl()}/${documentPath}`, undefined, true);
  return document ? decodeDocument<T>(document) : null;
}

async function createDocument(collectionPath: string, data: Record<string, unknown>, documentId = randomUUID()): Promise<string> {
  const searchParams = new URLSearchParams();
  searchParams.set('documentId', documentId);

  await firestoreRequest(
    `${getDocumentsBaseUrl()}/${collectionPath}?${searchParams.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        fields: encodeFields(data),
      }),
    }
  );

  return documentId;
}

async function updateDocument(documentPath: string, data: Record<string, unknown>): Promise<boolean> {
  const searchParams = new URLSearchParams();
  for (const fieldPath of Object.keys(data).filter((key) => data[key] !== undefined)) {
    searchParams.append('updateMask.fieldPaths', fieldPath);
  }

  await firestoreRequest(`${getDocumentsBaseUrl()}/${documentPath}?${searchParams.toString()}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: encodeFields(data),
    }),
  });

  return true;
}

async function deleteDocument(documentPath: string): Promise<boolean> {
  await firestoreRequest(`${getDocumentsBaseUrl()}/${documentPath}`, {
    method: 'DELETE',
  });
  return true;
}

function buildLatestActivity(type: LatestActivityRecord['type'], item?: { title?: string; createdAt?: string }): LatestActivityRecord | null {
  if (!item?.title || !item.createdAt) {
    return null;
  }

  return {
    type,
    title: item.title,
    date: item.createdAt,
  };
}

export async function listWriteups(): Promise<WriteupRecord[]> {
  return listCollection<WriteupRecord>('ctfWriteups', { orderBy: 'createdAt desc' });
}

export async function getWriteupById(id: string): Promise<WriteupRecord | null> {
  return getDocument<WriteupRecord>(`ctfWriteups/${id}`);
}

export async function createWriteup(data: Partial<WriteupRecord>): Promise<string> {
  const now = new Date().toISOString();
  return createDocument('ctfWriteups', {
    title: data.title ?? null,
    competition: data.competition ?? null,
    category: data.category ?? null,
    difficulty: data.difficulty ?? null,
    date: data.date ?? null,
    summary: data.summary ?? null,
    content: data.content ?? null,
    flag: data.flag ?? null,
    tags: data.tags ?? [],
    createdAt: data.createdAt ?? now,
    updatedAt: now,
  });
}

export async function updateWriteup(id: string, data: Partial<WriteupRecord>): Promise<boolean> {
  return updateDocument(`ctfWriteups/${id}`, {
    ...(data.title !== undefined ? { title: data.title ?? null } : {}),
    ...(data.competition !== undefined ? { competition: data.competition ?? null } : {}),
    ...(data.category !== undefined ? { category: data.category ?? null } : {}),
    ...(data.difficulty !== undefined ? { difficulty: data.difficulty ?? null } : {}),
    ...(data.date !== undefined ? { date: data.date ?? null } : {}),
    ...(data.summary !== undefined ? { summary: data.summary ?? null } : {}),
    ...(data.content !== undefined ? { content: data.content ?? null } : {}),
    ...(data.flag !== undefined ? { flag: data.flag ?? null } : {}),
    ...(data.tags !== undefined ? { tags: data.tags } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteWriteup(id: string): Promise<boolean> {
  return deleteDocument(`ctfWriteups/${id}`);
}

export async function listProjects(): Promise<ProjectRecord[]> {
  return listCollection<ProjectRecord>('projects', { orderBy: 'createdAt desc' });
}

export async function createProject(data: Partial<ProjectRecord>): Promise<string> {
  const now = new Date().toISOString();
  return createDocument('projects', {
    title: data.title ?? null,
    description: data.description ?? null,
    imageUrl: data.imageUrl ?? null,
    projectUrl: data.projectUrl ?? null,
    category: data.category ?? null,
    tags: data.tags ?? [],
    createdAt: data.createdAt ?? now,
    updatedAt: now,
  });
}

export async function updateProject(id: string, data: Partial<ProjectRecord>): Promise<boolean> {
  return updateDocument(`projects/${id}`, {
    ...(data.title !== undefined ? { title: data.title ?? null } : {}),
    ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl ?? null } : {}),
    ...(data.projectUrl !== undefined ? { projectUrl: data.projectUrl ?? null } : {}),
    ...(data.category !== undefined ? { category: data.category ?? null } : {}),
    ...(data.tags !== undefined ? { tags: data.tags } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProject(id: string): Promise<boolean> {
  return deleteDocument(`projects/${id}`);
}

export async function listAchievements(): Promise<AchievementRecord[]> {
  return listCollection<AchievementRecord>('achievements', { orderBy: 'createdAt desc' });
}

export async function createAchievement(data: Partial<AchievementRecord>): Promise<string> {
  const now = new Date().toISOString();
  return createDocument('achievements', {
    title: data.title ?? null,
    issuer: data.issuer ?? null,
    platform: data.platform ?? null,
    description: data.description ?? null,
    imageUrl: data.imageUrl ?? null,
    date: data.date ?? null,
    createdAt: data.createdAt ?? now,
    updatedAt: now,
  });
}

export async function updateAchievement(id: string, data: Partial<AchievementRecord>): Promise<boolean> {
  return updateDocument(`achievements/${id}`, {
    ...(data.title !== undefined ? { title: data.title ?? null } : {}),
    ...(data.issuer !== undefined ? { issuer: data.issuer ?? null } : {}),
    ...(data.platform !== undefined ? { platform: data.platform ?? null } : {}),
    ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl ?? null } : {}),
    ...(data.date !== undefined ? { date: data.date ?? null } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteAchievement(id: string): Promise<boolean> {
  return deleteDocument(`achievements/${id}`);
}

export async function listSecureMessages(): Promise<SecureMessageRecord[]> {
  return listCollection<SecureMessageRecord>('users/admin/secureMessages', { orderBy: 'createdAt desc' });
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<string> {
  const now = new Date().toISOString();
  return createDocument('users/admin/secureMessages', {
    title: input.subject,
    content: `From: ${input.name} (${input.email})\n\n${input.message}`,
    createdAt: now,
    updatedAt: now,
    username: input.name,
    source: 'contact-form',
  });
}

export async function listAccessLogs(limit = 200): Promise<AccessLogRecord[]> {
  return listCollection<AccessLogRecord>('securePageAccessLogs', {
    orderBy: 'accessedAt desc',
    pageSize: Math.max(1, Math.min(500, limit)),
  });
}

export async function createAccessLog(input: {
  username: string;
  accessedAt: string;
  accessSuccessful: boolean;
  ip: string;
}): Promise<string> {
  return createDocument('securePageAccessLogs', {
    username: input.username,
    accessedAt: input.accessedAt,
    accessSuccessful: input.accessSuccessful,
    ip: input.ip,
    createdAt: new Date().toISOString(),
  });
}

export async function getHomeSummary(): Promise<HomeSummaryResponse> {
  const [writeups, projects, achievements] = await Promise.all([
    listWriteups(),
    listProjects(),
    listAchievements(),
  ]);

  const latestCandidates = [
    buildLatestActivity('WRITE-UP', writeups[0]),
    buildLatestActivity('PROJECT', projects[0]),
    buildLatestActivity('ACHIEVEMENT', achievements[0]),
  ]
    .filter((candidate): candidate is LatestActivityRecord => Boolean(candidate))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  return {
    writeupCount: writeups.length,
    projectCount: projects.length,
    achievementCount: achievements.length,
    latestActivity: latestCandidates[0] ?? null,
  };
}