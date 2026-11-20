/**
 * Recent Items utility — stores last 5 viewed issue keys/titles in localStorage.
 * Shared across components via direct localStorage calls (no React context overhead).
 */

export interface RecentItem {
  id: string;
  key: string;
  title: string;
  type: string;
  projectKey?: string;
  viewedAt: number;
}

const STORAGE_KEY = "tamtask_recent_issues";
const MAX_ITEMS = 5;

export const recentItems = {
  get(): RecentItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  push(item: Omit<RecentItem, "viewedAt">) {
    if (typeof window === "undefined") return;
    try {
      const existing = recentItems.get().filter((r) => r.id !== item.id);
      const updated: RecentItem[] = [
        { ...item, viewedAt: Date.now() },
        ...existing,
      ].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Dispatch storage event so Navbar can react without polling
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    } catch {}
  },

  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  },
};
