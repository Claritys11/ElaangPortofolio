const VALID_STORAGE_TYPES = ['firebase', 'sqlite'] as const;

export type StorageType = (typeof VALID_STORAGE_TYPES)[number];

const DEFAULT_STORAGE_TYPE: StorageType = 'sqlite';

function isStorageType(value: string): value is StorageType {
  return (VALID_STORAGE_TYPES as readonly string[]).includes(value);
}

export function getStorageType(): StorageType {
  const rawValue = (process.env.STORAGE_TYPE ?? process.env.NEXT_PUBLIC_STORAGE_TYPE)?.trim().toLowerCase();

  if (!rawValue) {
    return DEFAULT_STORAGE_TYPE;
  }

  if (!isStorageType(rawValue)) {
    throw new Error(
      `Invalid STORAGE_TYPE/NEXT_PUBLIC_STORAGE_TYPE: "${rawValue}". Allowed values: ${VALID_STORAGE_TYPES.join(', ')}.`
    );
  }

  return rawValue;
}
