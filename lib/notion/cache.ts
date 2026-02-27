/**
 * Server-side in-memory cache for Notion data.
 * Avoids re-fetching all questions + their blocks on every page load.
 * Cache lives as long as the Next.js server process is running.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let questionsCache: CacheEntry<any[]> | null = null;
let schemaCache: CacheEntry<{ categories: string[]; tags: string[] }> | null = null;

export const notionCache = {
  getQuestions(): any[] | null {
    if (questionsCache && Date.now() - questionsCache.timestamp < CACHE_TTL_MS) {
      return questionsCache.data;
    }
    return null;
  },

  setQuestions(data: any[]): void {
    questionsCache = { data, timestamp: Date.now() };
  },

  getSchema(): { categories: string[]; tags: string[] } | null {
    if (schemaCache && Date.now() - schemaCache.timestamp < CACHE_TTL_MS) {
      return schemaCache.data;
    }
    return null;
  },

  setSchema(data: { categories: string[]; tags: string[] }): void {
    schemaCache = { data, timestamp: Date.now() };
  },

  /** Invalidate the questions cache (call after create/update/delete) */
  invalidateQuestions(): void {
    questionsCache = null;
  },

  /** Invalidate all caches */
  invalidateAll(): void {
    questionsCache = null;
    schemaCache = null;
  },
};
