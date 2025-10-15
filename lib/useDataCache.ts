'use client';

import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  key: string;
}

// Default TTL values (in milliseconds)
const DEFAULT_TTL = {
  categories: 24 * 60 * 60 * 1000, // 24 hours
  products: 2 * 60 * 60 * 1000, // 2 hours
  categoryProducts: 1 * 60 * 60 * 1000, // 1 hour
  search: 30 * 60 * 1000, // 30 minutes
};

export function useDataCache<T>(options: CacheOptions) {
  const { ttl = DEFAULT_TTL.categories, key } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCacheKey = useCallback((suffix?: string) => {
    return suffix ? `${key}_${suffix}` : key;
  }, [key]);

  const getCachedData = useCallback(<T>(cacheKey: string): T | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error reading cache:', error);
      localStorage.removeItem(cacheKey);
      return null;
    }
  }, []);

  const setCachedData = useCallback(<T>(cacheKey: string, data: T, customTtl?: number): void => {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: customTtl || ttl,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }, [ttl]);

  const fetchData = useCallback(async (
    fetchFn: () => Promise<T>,
    cacheKey?: string,
    customTtl?: number
  ): Promise<T | null> => {
    const finalCacheKey = cacheKey ? getCacheKey(cacheKey) : getCacheKey();
    
    // Try to get from cache first
    const cachedData = getCachedData<T>(finalCacheKey);
    if (cachedData) {
      setData(cachedData);
      return cachedData;
    }

    // Fetch from API
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setCachedData(finalCacheKey, result, customTtl);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getCacheKey, getCachedData, setCachedData]);

  const invalidateCache = useCallback((suffix?: string) => {
    const cacheKey = getCacheKey(suffix);
    localStorage.removeItem(cacheKey);
    setData(null);
  }, [getCacheKey]);

  const clearAllCache = useCallback(() => {
    const keys = Object.keys(localStorage);
    keys.forEach(cacheKey => {
      if (cacheKey.startsWith(key)) {
        localStorage.removeItem(cacheKey);
      }
    });
    setData(null);
  }, [key]);

  return {
    data,
    loading,
    error,
    fetchData,
    invalidateCache,
    clearAllCache,
  };
}

// Specific hooks for common data types
export function useCategories() {
  return useDataCache<any[]>({
    key: 'categories',
    ttl: DEFAULT_TTL.categories,
  });
}

export function useProducts(categoryId?: number) {
  return useDataCache<any[]>({
    key: 'products',
    ttl: DEFAULT_TTL.products,
  });
}

export function useCategoryProducts(categoryId: number) {
  return useDataCache<any[]>({
    key: 'categoryProducts',
    ttl: DEFAULT_TTL.categoryProducts,
  });
}

export function useSearchResults(query: string) {
  return useDataCache<any[]>({
    key: 'search',
    ttl: DEFAULT_TTL.search,
  });
}
