// High-Performance In-Memory Cache for TamTask Bootstrap & Workspace State

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();

export const CacheKeys = {
  BOOTSTRAP_GLOBAL: "bootstrap:global",
  bootstrapProject: (projectId: string) => `bootstrap:project:${projectId}`,
  USERS: "users:all",
};

export function getFromCache<T>(key: string, ttlMs: number = 30000): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (now - entry.timestamp > ttlMs) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setInCache<T>(key: string, data: T): void {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    cacheStore.clear();
    return;
  }
  cacheStore.forEach((_, key) => {
    if (key.startsWith(keyPrefix)) {
      cacheStore.delete(key);
    }
  });
}

export function invalidateBootstrapCache(): void {
  invalidateCache("bootstrap:");
}
