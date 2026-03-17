'use client';

import { FirebaseError } from 'firebase/app';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { getDefaultProfileSettings, mergeProfileSettings, normalizeProfileSettings } from '@/lib/about-default';
import type {
  AchievementRecord,
  HomeSummaryResponse,
  LatestActivityRecord,
  ProfileSettingsRecord,
  ProjectRecord,
  SecureMessageRecord,
  WriteupRecord,
} from '@/lib/portfolio-types';

interface FirebaseClientRouteResult<T> {
  handled: boolean;
  data?: T;
}

type AdminCollectionRoute = 'writeups' | 'projects' | 'achievements';

interface LatestActivityCandidate {
  type: LatestActivityRecord['type'];
  title: string;
  date: string;
}

const adminCollectionMap: Record<AdminCollectionRoute, string> = {
  writeups: 'ctfWriteups',
  projects: 'projects',
  achievements: 'achievements',
};

const loginErrorCodes = new Set([
  'auth/invalid-credential',
  'auth/invalid-email',
  'auth/invalid-login-credentials',
  'auth/user-not-found',
  'auth/wrong-password',
]);

function toHandled<T>(data: T): FirebaseClientRouteResult<T> {
  return { handled: true, data };
}

function parsePath(input: RequestInfo | URL): string | null {
  if (typeof input === 'string') {
    if (typeof window === 'undefined') {
      return input;
    }

    try {
      return new URL(input, window.location.origin).pathname;
    } catch {
      return input;
    }
  }

  if (input instanceof URL) {
    return input.pathname;
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    if (typeof window === 'undefined') {
      return new URL(input.url).pathname;
    }

    return new URL(input.url, window.location.origin).pathname;
  }

  return null;
}

function parseMethod(init?: RequestInit): string {
  return (init?.method ?? 'GET').toUpperCase();
}

function parseJsonBody(init?: RequestInit): Record<string, unknown> {
  if (!init?.body) {
    return {};
  }

  if (typeof init.body === 'string') {
    try {
      return JSON.parse(init.body) as Record<string, unknown>;
    } catch {
      throw new Error('Bad request.');
    }
  }

  throw new Error('Bad request.');
}

function serializeFirestoreValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [key, serializeFirestoreValue(entryValue)])
    );
  }

  return value;
}

function mapQueryDocument<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  return {
    id: snapshot.id,
    ...(serializeFirestoreValue(snapshot.data()) as Record<string, unknown>),
  } as T;
}

function mapDocumentData<T>(id: string, data: DocumentData | undefined): T {
  return {
    id,
    ...(serializeFirestoreValue(data ?? {}) as Record<string, unknown>),
  } as T;
}

function getOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function ensureMethod(method: string, allowedMethods: string[]): void {
  if (!allowedMethods.includes(method)) {
    throw new Error('Request failed with status 405');
  }
}

function requireNonEmptyString(value: unknown, fallbackError: string): string {
  if (typeof value !== 'string') {
    throw new Error(fallbackError);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(fallbackError);
  }
  return trimmed;
}

async function requireAdminSession(): Promise<void> {
  // In firebase mode, login is via .env server credentials (not Firebase Auth).
  // Verify the server session cookie is valid before allowing Firestore admin access.
  const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error('Unauthorized.');
  }
}

async function getLatestCandidate(
  db: Firestore,
  collectionName: string,
  type: LatestActivityRecord['type']
): Promise<LatestActivityCandidate | null> {
  const snapshot = await getDocs(query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(1)));
  const docSnapshot = snapshot.docs[0];
  if (!docSnapshot) {
    return null;
  }

  const mapped = mapQueryDocument<{ id: string; title?: string; createdAt?: string }>(docSnapshot);
  if (!mapped.title || !mapped.createdAt) {
    return null;
  }

  return {
    type,
    title: mapped.title,
    date: mapped.createdAt,
  };
}

async function getPublicSummary(db: Firestore): Promise<HomeSummaryResponse> {
  const [writeupCountSnapshot, projectCountSnapshot, achievementCountSnapshot, latestWriteup, latestProject, latestAchievement] =
    await Promise.all([
      getCountFromServer(collection(db, 'ctfWriteups')),
      getCountFromServer(collection(db, 'projects')),
      getCountFromServer(collection(db, 'achievements')),
      getLatestCandidate(db, 'ctfWriteups', 'WRITE-UP'),
      getLatestCandidate(db, 'projects', 'PROJECT'),
      getLatestCandidate(db, 'achievements', 'ACHIEVEMENT'),
    ]);

  const latestCandidates = [latestWriteup, latestProject, latestAchievement]
    .filter((candidate): candidate is LatestActivityCandidate => Boolean(candidate))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  return {
    writeupCount: Number(writeupCountSnapshot.data().count ?? 0),
    projectCount: Number(projectCountSnapshot.data().count ?? 0),
    achievementCount: Number(achievementCountSnapshot.data().count ?? 0),
    latestActivity: latestCandidates[0] ?? null,
  };
}

async function getPublicCollection<T>(db: Firestore, collectionName: string): Promise<T[]> {
  const snapshot = await getDocs(query(collection(db, collectionName), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnapshot) => mapQueryDocument<T>(docSnapshot));
}

async function getProfileSettingsDocument(db: Firestore): Promise<ProfileSettingsRecord> {
  const snapshot = await getDoc(doc(db, 'settings', 'profile'));
  if (!snapshot.exists()) {
    return getDefaultProfileSettings();
  }

  const normalized = normalizeProfileSettings(snapshot.data() as Partial<ProfileSettingsRecord>);
  const updatedAt = snapshot.data()?.updatedAt;

  return {
    ...normalized,
    ...(typeof updatedAt === 'string' ? { updatedAt } : {}),
  };
}

async function handleContactRoute<T>(db: Firestore, method: string, init?: RequestInit): Promise<FirebaseClientRouteResult<T>> {
  ensureMethod(method, ['POST']);
  const payload = parseJsonBody(init);

  const name = requireNonEmptyString(payload.name, 'All fields are required.');
  const email = requireNonEmptyString(payload.email, 'All fields are required.');
  const subject = requireNonEmptyString(payload.subject, 'All fields are required.');
  const message = requireNonEmptyString(payload.message, 'All fields are required.');
  const now = new Date().toISOString();

  await addDoc(collection(db, 'users', 'admin', 'secureMessages'), {
    title: subject,
    content: `From: ${name} (${email})\n\n${message}`,
    createdAt: now,
    updatedAt: now,
    username: name,
    source: 'contact-form',
  });

  return toHandled({ ok: true } as T);
}

// Auth routes (/api/auth/*) always go to the server and are never intercepted here.
async function handleAuthRoutes<T>(): Promise<FirebaseClientRouteResult<T>> {
  return { handled: false };
}

async function handleAdminCollectionRoute<T>(
  db: Firestore,
  path: string,
  method: string,
  init?: RequestInit
): Promise<FirebaseClientRouteResult<T>> {
  if (path === '/api/admin/profile') {
    await requireAdminSession();

    if (method === 'GET') {
      return toHandled((await getProfileSettingsDocument(db)) as T);
    }

    if (method === 'PUT') {
      const payload = parseJsonBody(init);
      const existing = await getProfileSettingsDocument(db);
      const merged = mergeProfileSettings(existing, payload as Partial<ProfileSettingsRecord>);
      const updatedAt = new Date().toISOString();

      await setDoc(doc(db, 'settings', 'profile'), {
        ...merged,
        updatedAt,
      });

      return toHandled({ ...merged, updatedAt } as T);
    }

    throw new Error('Request failed with status 405');
  }

  const collectionMatch = path.match(/^\/api\/admin\/(writeups|projects|achievements)$/);
  if (collectionMatch) {
    const routeName = collectionMatch[1] as AdminCollectionRoute;
    const collectionName = adminCollectionMap[routeName];
    await requireAdminSession();

    if (method === 'GET') {
      const snapshot = await getDocs(query(collection(db, collectionName), orderBy('createdAt', 'desc')));
      return toHandled(snapshot.docs.map((docSnapshot) => mapQueryDocument(docSnapshot)) as T);
    }

    if (method === 'POST') {
      const payload = parseJsonBody(init);
      const docRef = await addDoc(collection(db, collectionName), {
        ...payload,
        createdAt: getOptionalString(payload.createdAt) ?? new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });

      return toHandled({ id: docRef.id } as T);
    }

    throw new Error('Request failed with status 405');
  }

  const itemMatch = path.match(/^\/api\/admin\/(writeups|projects|achievements)\/([^/]+)$/);
  if (!itemMatch) {
    return { handled: false };
  }

  await requireAdminSession();

  const routeName = itemMatch[1] as AdminCollectionRoute;
  const documentId = decodeURIComponent(itemMatch[2]);
  const collectionName = adminCollectionMap[routeName];
  const documentRef = doc(db, collectionName, documentId);

  if (method === 'PUT') {
    const payload = parseJsonBody(init);
    await updateDoc(documentRef, {
      ...payload,
      updatedAt: serverTimestamp(),
    });

    return toHandled({ ok: true } as T);
  }

  if (method === 'DELETE') {
    await deleteDoc(documentRef);
    return toHandled({ ok: true } as T);
  }

  throw new Error('Request failed with status 405');
}

async function handleAdminReadOnlyRoute<T>(
  db: Firestore,
  path: string,
  method: string
): Promise<FirebaseClientRouteResult<T>> {
  if (path === '/api/admin/messages') {
    ensureMethod(method, ['GET']);
    await requireAdminSession();

    const snapshot = await getDocs(query(collection(db, 'users', 'admin', 'secureMessages'), orderBy('createdAt', 'desc')));
    return toHandled(snapshot.docs.map((docSnapshot) => mapQueryDocument<SecureMessageRecord>(docSnapshot)) as T);
  }

  if (path === '/api/admin/logs') {
    ensureMethod(method, ['GET']);
    await requireAdminSession();

    const snapshot = await getDocs(query(collection(db, 'securePageAccessLogs'), orderBy('accessedAt', 'desc'), limit(200)));
    return toHandled(snapshot.docs.map((docSnapshot) => mapQueryDocument(docSnapshot)) as T);
  }

  return { handled: false };
}

async function handlePublicRoute<T>(db: Firestore, path: string, method: string): Promise<FirebaseClientRouteResult<T>> {
  if (path === '/api/public/summary') {
    ensureMethod(method, ['GET']);
    return toHandled((await getPublicSummary(db)) as T);
  }

  if (path === '/api/public/profile') {
    ensureMethod(method, ['GET']);
    return toHandled((await getProfileSettingsDocument(db)) as T);
  }

  if (path === '/api/public/projects') {
    ensureMethod(method, ['GET']);
    return toHandled((await getPublicCollection<ProjectRecord>(db, 'projects')) as T);
  }

  if (path === '/api/public/achievements') {
    ensureMethod(method, ['GET']);
    return toHandled((await getPublicCollection<AchievementRecord>(db, 'achievements')) as T);
  }

  if (path === '/api/public/writeups') {
    ensureMethod(method, ['GET']);
    return toHandled((await getPublicCollection<WriteupRecord>(db, 'ctfWriteups')) as T);
  }

  const writeupMatch = path.match(/^\/api\/public\/writeups\/([^/]+)$/);
  if (!writeupMatch) {
    return { handled: false };
  }

  ensureMethod(method, ['GET']);
  const writeupId = decodeURIComponent(writeupMatch[1]);
  const snapshot = await getDoc(doc(db, 'ctfWriteups', writeupId));
  if (!snapshot.exists()) {
    throw new Error('Write-up not found.');
  }

  return toHandled(mapDocumentData<WriteupRecord>(snapshot.id, snapshot.data()) as T);
}

function mapFirebaseError(error: unknown): Error {
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return new Error('Unauthorized.');
    }

    if (error.code === 'storage/unauthorized') {
      return new Error('Unauthorized.');
    }

    if (error.code === 'storage/no-default-bucket') {
      return new Error(
        'Firebase Storage bucket is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (example: your-project.firebasestorage.app).'
      );
    }

    if (error.code === 'storage/bucket-not-found') {
      return new Error(
        'Firebase Storage bucket not found. Verify NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET and ensure Firebase Storage is enabled in the project.'
      );
    }

    if (error.code === 'not-found') {
      return new Error('Not found.');
    }

    if (error.code === 'storage/object-not-found') {
      return new Error('Not found.');
    }

    if (error.code === 'storage/unknown') {
      const message = error.message || '';
      if (message.includes('404')) {
        return new Error(
          'Firebase Storage returned 404. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET and ensure Firebase Storage bucket exists and is active.'
        );
      }
    }

    if (loginErrorCodes.has(error.code)) {
      return new Error('Invalid credentials.');
    }

    return new Error(error.message || 'Request failed with status 500');
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Request failed with status 500');
}

export async function handleFirebaseClientRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<FirebaseClientRouteResult<T>> {
  const path = parsePath(input);
  if (!path?.startsWith('/api/')) {
    return { handled: false };
  }

  const method = parseMethod(init);
  const { firestore } = initializeFirebase();

  try {
    const publicResult = await handlePublicRoute<T>(firestore, path, method);
    if (publicResult.handled) {
      return publicResult;
    }

    if (path === '/api/contact') {
      return await handleContactRoute<T>(firestore, method, init);
    }

    const authResult = await handleAuthRoutes<T>();
    if (authResult.handled) {
      return authResult;
    }

    const adminReadResult = await handleAdminReadOnlyRoute<T>(firestore, path, method);
    if (adminReadResult.handled) {
      return adminReadResult;
    }

    const adminWriteResult = await handleAdminCollectionRoute<T>(firestore, path, method, init);
    if (adminWriteResult.handled) {
      return adminWriteResult;
    }

    return { handled: false };
  } catch (error) {
    throw mapFirebaseError(error);
  }
}
