'use client';

import { useState, useEffect, useCallback } from 'react';

interface PaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

interface PaginationResult<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading: boolean;
  error: Error | null;
  loadPage: (page: number) => Promise<void>;
  loadNextPage: () => Promise<void>;
  loadPreviousPage: () => Promise<void>;
  reset: () => void;
}

export function usePagination<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  options: PaginationOptions = {}
): PaginationResult<T> {
  const { pageSize = 12, initialPage = 1 } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPage = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, pageSize);
      setData(result.data);
      setCurrentPage(page);
      setTotalPages(Math.ceil(result.total / pageSize));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load data');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, pageSize]);

  const loadNextPage = useCallback(async () => {
    if (currentPage < totalPages) {
      await loadPage(currentPage + 1);
    }
  }, [currentPage, totalPages, loadPage]);

  const loadPreviousPage = useCallback(async () => {
    if (currentPage > 1) {
      await loadPage(currentPage - 1);
    }
  }, [currentPage, loadPage]);

  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(initialPage);
    setTotalPages(0);
    setError(null);
  }, [initialPage]);

  // Load initial page
  useEffect(() => {
    loadPage(initialPage);
  }, [loadPage, initialPage]);

  return {
    data,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    isLoading,
    error,
    loadPage,
    loadNextPage,
    loadPreviousPage,
    reset,
  };
}

// Specific hook for products with caching
export function useProductPagination(
  categoryId: number,
  pageSize: number = 12
) {
  return usePagination(
    async (page: number, size: number) => {
      const response = await fetch(`/api/products/by-category/${categoryId}?page=${page}&limit=${size}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      
      // For now, we'll simulate pagination on the client side
      // In a real implementation, you'd want server-side pagination
      const startIndex = (page - 1) * size;
      const endIndex = startIndex + size;
      const paginatedData = data.slice(startIndex, endIndex);
      
      return {
        data: paginatedData,
        total: data.length,
      };
    },
    { pageSize }
  );
}
