// In-memory cache to reduce CPU usage and file system operations
// This dramatically reduces function execution time

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now() + (ttl || this.defaultTTL),
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const memoryCache = new MemoryCache();

// Note: setInterval doesn't work in serverless environments
// Cache entries expire on access (lazy cleanup)
// For serverless, rely on TTL expiration

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS_LIST: 'products:list',
  PRODUCTS_BY_SLUG: (slug: string) => `product:${slug}`,
  CATEGORIES_LIST: 'categories:list',
  CATEGORY_BY_SLUG: (slug: string) => `category:${slug}`,
  PRODUCT_FILES_LIST: 'products:files:list',
  CATEGORY_PRODUCTS_MAP: 'category-products:map',
} as const;

