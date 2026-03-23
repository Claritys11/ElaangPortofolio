interface GithubStorageConfig {
  owner: string;
  repo: string;
  token: string;
}

interface GithubReleaseAsset {
  id: number;
  name: string;
  url: string;
  browser_download_url: string;
  content_type: string;
}

interface GithubRelease {
  id: number;
  upload_url: string;
  assets?: GithubReleaseAsset[];
}

interface GithubStorageOptions {
  owner?: string;
  repo?: string;
  token?: string;
}

interface GithubUploadResponse {
  id: number;
  url: string;
  content_type: string;
  name: string;
  message?: string;
  errors?: Array<{ resource: string; code: string; field?: string; message: string }>;
}

const RELEASE_CACHE_TTL_MS = 10_000;

type ReleaseCacheEntry = {
  expiresAt: number;
  value: GithubRelease | null;
};

const releaseByTagCache = new Map<string, ReleaseCacheEntry>();
const releaseByTagInFlight = new Map<string, Promise<GithubRelease | null>>();

function getReleaseCacheKey(owner: string, repo: string, tag: string): string {
  return `${owner}/${repo}#${tag}`;
}

function setCachedRelease(owner: string, repo: string, tag: string, value: GithubRelease | null): void {
  releaseByTagCache.set(getReleaseCacheKey(owner, repo, tag), {
    value,
    expiresAt: Date.now() + RELEASE_CACHE_TTL_MS,
  });
}

function getCachedRelease(owner: string, repo: string, tag: string): GithubRelease | null | undefined {
  const key = getReleaseCacheKey(owner, repo, tag);
  const cached = releaseByTagCache.get(key);
  if (!cached) {
    return undefined;
  }

  if (cached.expiresAt <= Date.now()) {
    releaseByTagCache.delete(key);
    return undefined;
  }

  return cached.value;
}

function invalidateReleaseCache(owner: string, repo: string, tag: string): void {
  releaseByTagCache.delete(getReleaseCacheKey(owner, repo, tag));
}

function readConfigFromEnv(): GithubStorageConfig {
  return {
    owner: process.env.GH_OWNER?.trim() ?? '',
    repo: process.env.GH_REPO?.trim() ?? '',
    token: process.env.GH_TOKEN?.trim() ?? '',
  };
}

function assertConfigured(config: GithubStorageConfig): void {
  if (!config.owner || !config.repo || !config.token) {
    throw new Error('GitHub storage is not configured. Set GH_OWNER, GH_REPO, and GH_TOKEN.');
  }
}

function resolveConfig(overrides: GithubStorageOptions = {}): GithubStorageConfig {
  const envConfig = readConfigFromEnv();
  const config: GithubStorageConfig = {
    owner: overrides.owner ?? envConfig.owner,
    repo: overrides.repo ?? envConfig.repo,
    token: overrides.token ?? envConfig.token,
  };

  assertConfigured(config);
  return config;
}

function githubHeaders(token: string, accept = 'application/vnd.github+json'): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'SigmaBangetPortfolioGweh',
  };
}

async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function isValidTag(tag: string): boolean {
  if (!tag) {
    return false;
  }

  if (tag === '@') {
    return false;
  }

  if (/[\x00-\x1f\x7f]/.test(tag)) {
    return false;
  }

  if (/[ ~^:?*\[\\]/.test(tag)) {
    return false;
  }

  if (/@\{/.test(tag)) {
    return false;
  }

  if (/\.\./.test(tag)) {
    return false;
  }

  if (/\.$/.test(tag)) {
    return false;
  }

  if (/\.lock$/i.test(tag)) {
    return false;
  }

  if (/^\//.test(tag) || /\/$/.test(tag)) {
    return false;
  }

  if (/\/\//.test(tag)) {
    return false;
  }

  if (/(^|\/)\./.test(tag)) {
    return false;
  }

  return true;
}

function resolveTagFromFileName(fileName: string): string {
  const tag = fileName.trim();

  if (!isValidTag(tag)) {
    throw new Error('Invalid file name. Unable to derive a valid release tag from this file name.');
  }

  return tag;
}

export function getPublicUploadUrl(name: string): string {
  return `/api/public/uploads/${encodeURIComponent(name)}`;
}

async function getReleaseByTag(tag: string, config: GithubStorageConfig): Promise<GithubRelease | null> {
  const cacheKey = getReleaseCacheKey(config.owner, config.repo, tag);
  const cached = getCachedRelease(config.owner, config.repo, tag);
  if (cached !== undefined) {
    return cached;
  }

  const inFlight = releaseByTagInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const endpoint = `https://api.github.com/repos/${config.owner}/${config.repo}/releases/tags/${encodeURIComponent(tag)}`;
  const fetchPromise = (async () => {
    try {
      const response = await fetch(endpoint, {
        cache: 'no-store',
        headers: githubHeaders(config.token),
      });

      if (!response.ok) {
        setCachedRelease(config.owner, config.repo, tag, null);
        return null;
      }

      const release = (await response.json()) as GithubRelease;
      setCachedRelease(config.owner, config.repo, tag, release);
      return release;
    } catch {
      return null;
    } finally {
      releaseByTagInFlight.delete(cacheKey);
    }
  })();

  releaseByTagInFlight.set(cacheKey, fetchPromise);
  return fetchPromise;
}

async function createReleaseByTag(
  tag: string,
  config: GithubStorageConfig
): Promise<
  | {
      ok: true;
      release: GithubRelease;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      details?: unknown;
    }
> {
  const endpoint = `https://api.github.com/repos/${config.owner}/${config.repo}/releases`;
  const response = await fetch(endpoint, {
    method: 'POST',
    cache: 'no-store',
    headers: githubHeaders(config.token),
    body: JSON.stringify({
      tag_name: tag,
      name: tag,
      body: `Asset release for ${tag}`,
      draft: false,
      prerelease: false,
    }),
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return {
      ok: false,
      error: payload?.message ?? 'Failed to create release.',
      status: response.status,
      details: payload?.errors ?? payload,
    };
  }

  const release = payload as GithubRelease;
  setCachedRelease(config.owner, config.repo, tag, release);

  return {
    ok: true,
    release,
  };
}

async function ensureReleaseByTag(
  tag: string,
  config: GithubStorageConfig
): Promise<
  | {
      ok: true;
      release: GithubRelease;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      details?: unknown;
    }
> {
  const existingRelease = await getReleaseByTag(tag, config);
  if (existingRelease) {
    return {
      ok: true,
      release: existingRelease,
    };
  }

  const createdRelease = await createReleaseByTag(tag, config);
  if (createdRelease.ok) {
    return createdRelease;
  }

  if (createdRelease.status === 422) {
    const releaseAfterConflict = await getReleaseByTag(tag, config);
    if (releaseAfterConflict) {
      return {
        ok: true,
        release: releaseAfterConflict,
      };
    }
  }

  return createdRelease;
}

async function getAssetByName(
  fileName: string,
  options: GithubStorageOptions = {}
): Promise<
  | {
      ok: true;
      id: number;
      name: string;
      objectUrl: string;
      downloadUrl: string;
      contentType: string;
    }
  | {
      ok: false;
      error: string;
      status?: number;
    }
> {
  try {
    const config = resolveConfig(options);
    const releaseTag = resolveTagFromFileName(fileName);
    const release = await getReleaseByTag(releaseTag, config);

    if (!release?.assets?.length) {
      return { ok: false, error: 'Release or asset not found.', status: 404 };
    }

    const asset = release.assets.find((entry) => entry.name === fileName);
    if (!asset) {
      return { ok: false, error: 'Asset not found in release.', status: 404 };
    }

    return {
      ok: true,
      id: asset.id,
      name: asset.name,
      objectUrl: asset.url,
      downloadUrl: asset.browser_download_url,
      contentType: asset.content_type,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to resolve GitHub asset.',
      status: 500,
    };
  }
}

export async function uploadFileToGithubRelease(
  fileName: string,
  body: ReadableStream<Uint8Array> | ArrayBuffer,
  contentType: string,
  contentLength: number,
  options: GithubStorageOptions = {}
): Promise<
  | {
      ok: true;
      name: string;
      objectUrl: string;
      contentType: string;
      publicUrl: string;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      details?: unknown;
    }
> {
  try {
    const config = resolveConfig(options);
    const releaseTag = resolveTagFromFileName(fileName);
    const ensuredRelease = await ensureReleaseByTag(releaseTag, config);

    if (!ensuredRelease.ok) {
      return {
        ok: false,
        error: ensuredRelease.error,
        status: ensuredRelease.status,
        details: ensuredRelease.details,
      };
    }

    const uploadUrl = ensuredRelease.release.upload_url.replace(
      '{?name,label}',
      `?name=${encodeURIComponent(fileName)}`
    );

    const requestInit: RequestInit & { duplex?: 'half' } = {
      method: 'POST',
      headers: {
        ...githubHeaders(config.token),
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Length': String(contentLength),
      },
      body,
    };

    if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) {
      requestInit.duplex = 'half';
    }

    const response = await fetch(uploadUrl, requestInit);
    const payload = (await parseJsonSafe(response)) as GithubUploadResponse | null;

    if (!response.ok) {
      if (response.status === 422 && payload?.errors?.some((entry) => entry.code === 'already_exists')) {
        invalidateReleaseCache(config.owner, config.repo, releaseTag);
        const existingAsset = await getAssetByName(fileName, config);
        if (existingAsset.ok) {
          return {
            ok: true,
            name: existingAsset.name,
            objectUrl: existingAsset.objectUrl,
            contentType: existingAsset.contentType,
            publicUrl: getPublicUploadUrl(existingAsset.name),
          };
        }
      }

      return {
        ok: false,
        error: payload?.message ?? 'GitHub upload failed.',
        status: response.status,
        details: payload?.errors ?? payload,
      };
    }

    if (!payload) {
      return {
        ok: false,
        error: 'GitHub upload returned an empty response.',
        status: response.status,
      };
    }

    invalidateReleaseCache(config.owner, config.repo, releaseTag);

    return {
      ok: true,
      name: String(payload.name),
      objectUrl: String(payload.url),
      contentType: String(payload.content_type ?? contentType),
      publicUrl: getPublicUploadUrl(String(payload.name)),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Stream upload error.',
      status: 500,
      details: error,
    };
  }
}

export async function deleteFileFromGithubRelease(
  fileName: string,
  options: GithubStorageOptions = {}
): Promise<
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      details?: unknown;
    }
> {
  const asset = await getAssetByName(fileName, options);
  if (!asset.ok) {
    return {
      ok: false,
      error: asset.error,
      status: asset.status,
    };
  }

  try {
    const config = resolveConfig(options);
    const releaseTag = resolveTagFromFileName(fileName);
    const response = await fetch(asset.objectUrl, {
      method: 'DELETE',
      cache: 'no-store',
      headers: githubHeaders(config.token),
    });

    if (response.status === 204) {
      invalidateReleaseCache(config.owner, config.repo, releaseTag);
      return {
        ok: true,
        message: `Asset '${fileName}' deleted successfully.`,
      };
    }

    const payload = await parseJsonSafe(response);
    return {
      ok: false,
      error: 'Failed to delete asset.',
      status: response.status,
      details: payload,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Internal Server Error',
      status: 500,
      details: error,
    };
  }
}

export async function downloadFileFromGithubRelease(
  fileName: string,
  options: GithubStorageOptions = {}
): Promise<
  | {
      ok: true;
      response: Response;
      contentType: string;
    }
  | {
      ok: false;
      error: string;
      status?: number;
    }
> {
  try {
    const config = resolveConfig(options);
    const asset = await getAssetByName(fileName, config);

    if (!asset.ok) {
      return {
        ok: false,
        error: asset.error,
        status: asset.status,
      };
    }

    const response = await fetch(asset.objectUrl, {
      cache: 'no-store',
      headers: githubHeaders(config.token, 'application/octet-stream'),
    });

    if (!response.ok || !response.body) {
      return {
        ok: false,
        error: `Failed to fetch asset content (${response.status}).`,
        status: response.status,
      };
    }

    return {
      ok: true,
      response,
      contentType: response.headers.get('content-type') ?? asset.contentType,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to download asset from GitHub.',
      status: 500,
    };
  }
}
